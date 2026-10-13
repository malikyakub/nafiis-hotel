import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Contract, ContractFactory, JsonRpcProvider, Wallet, FetchRequest, Transaction, getCreateAddress } from 'ethers';
import { artifact } from './compile.mjs';

const localDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.chain-local');
const statePath = path.join(localDir, 'amoy-deployment.json');
const lockPath = path.join(localDir, 'deploy.lock');
let provider;
let lock;
let safeMessage = 'Deployment incomplete. Check local settings and test POL. Keep the saved deployment record.';
function stop(message) { safeMessage = message; throw new Error('Deployment stopped'); }
try {
  const missing = ['AMOY_RPC_URL', 'SYSTEM_WALLET_PRIVATE_KEY'].filter(name => !process.env[name]?.trim());
  if (missing.length) stop(`Enter these locally in .env.local: ${missing.join(', ')}.`);
  fs.mkdirSync(localDir, { recursive: true });
  try { lock = fs.openSync(lockPath, 'wx'); }
  catch { stop('Deployment lock exists. Close other deploy commands. If a shutdown left the lock behind, remove only .chain-local/deploy.lock, then rerun. Keep amoy-deployment.json.'); }
  fs.writeFileSync(lock, String(process.pid));
  const request = new FetchRequest(process.env.AMOY_RPC_URL);
  request.timeout = 10000;
  provider = new JsonRpcProvider(request, undefined, { cacheTimeout: -1, batchMaxCount: 1 });
  if ((await provider.getNetwork()).chainId !== 80002n) stop('RPC must use Polygon Amoy, chain 80002.');
  const wallet = new Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY, provider);
  const factory = new ContractFactory(artifact.abi, artifact.evm.bytecode.object, wallet);
  const deployment = await factory.getDeployTransaction();
  let state;
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } else {
    if (process.env.PROOF_REGISTRY_ADDRESS) stop('A contract is already configured. No new deployment sent.');
    if (await provider.getBalance(wallet.address) === 0n) stop(`Fund this dedicated Amoy address with test POL: ${wallet.address}`);
    const nonce = await provider.getTransactionCount(wallet.address, 'latest');
    if (nonce !== await provider.getTransactionCount(wallet.address, 'pending')) stop('Wallet already has a pending transaction. Wait before deploying.');
    const unsigned = await wallet.populateTransaction({ ...deployment, chainId: 80002, nonce, value: 0n });
    const signed = await wallet.signTransaction(unsigned);
    const parsed = Transaction.from(signed);
    state = { signed, hash: parsed.hash, address: getCreateAddress({ from: wallet.address, nonce }) };
    // Durable storage precedes broadcast. Restart reuses the same signed bytes.
    const fd = fs.openSync(statePath, 'wx', 0o600);
    try { fs.writeFileSync(fd, JSON.stringify(state)); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); }
  }
  const tx = Transaction.from(state.signed);
  if (tx.chainId !== 80002n || tx.from !== wallet.address || tx.to !== null || tx.value !== 0n ||
      tx.data !== deployment.data || tx.hash !== state.hash ||
      getCreateAddress({ from: wallet.address, nonce: tx.nonce }) !== state.address) {
    stop('Saved deployment does not match this wallet and contract source. Preserve the file and resolve the mismatch.');
  }
  if (process.env.PROOF_REGISTRY_ADDRESS && process.env.PROOF_REGISTRY_ADDRESS.toLowerCase() !== state.address.toLowerCase()) {
    stop('Configured contract differs from saved deployment. No transaction sent.');
  }
  process.stdout.write(`Deployment transaction: https://amoy.polygonscan.com/tx/${state.hash}\n`);
  let receipt = await provider.getTransactionReceipt(state.hash);
  if (!receipt) {
    try { await provider.broadcastTransaction(state.signed); }
    catch { /* Reconcile the saved hash even when the RPC response is lost. */ }
    receipt = await provider.getTransactionReceipt(state.hash);
  }
  if (!receipt || await receipt.confirmations() < 3) {
    process.stdout.write('Pending. Run this command again shortly to resume; do not delete the deployment record.\n');
    process.exitCode = 2;
  } else {
    if (receipt.status !== 1 || receipt.contractAddress !== state.address || receipt.from !== wallet.address) stop('Deployment failed or returned an unexpected receipt. Keep the record for diagnosis.');
    const block = await provider.getBlock(receipt.blockNumber);
    if (block?.hash !== receipt.blockHash) stop('Chain changed; rerun to reconcile.');
    const contract = new Contract(state.address, artifact.abi, provider);
    if (await provider.getCode(state.address) === '0x' || await contract.registrar() !== wallet.address) stop('Deployed contract could not be verified.');
    process.stdout.write(`Deployment confirmed. Add locally to .env.local, then restart the website:\nPROOF_REGISTRY_ADDRESS=${state.address}\n`);
  }
} catch {
  // Never print RPC errors, authenticated URLs, or signed payloads.
  process.stderr.write(`${safeMessage}\n`);
  process.exitCode = 1;
} finally {
  provider?.destroy();
  if (lock !== undefined) { fs.closeSync(lock); fs.unlinkSync(lockPath); }
}
