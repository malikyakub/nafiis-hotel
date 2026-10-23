import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { Wallet, formatEther } from 'ethers';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(root, '.env.local');
const tempPath = path.join(root, '.env.local.pending');
const localDir = path.join(root, '.chain-local');
const defaultRpc = 'https://polygon-amoy.drpc.org';
let message = 'Setup stopped. Existing secrets were not displayed. Check .env.local locally.';
try {
  let source = fs.readFileSync(envPath, 'utf8');
  const env = parseEnv(source);
  if (!env.SYSTEM_WALLET_PRIVATE_KEY && (env.PROOF_REGISTRY_ADDRESS || fs.existsSync(path.join(localDir, 'amoy-deployment.json')))) {
    throw new Error('Existing deployment requires its original wallet');
  }
  const wallet = env.SYSTEM_WALLET_PRIVATE_KEY ? new Wallet(env.SYSTEM_WALLET_PRIVATE_KEY) : Wallet.createRandom();
  const updates = {};
  if (!env.SYSTEM_WALLET_PRIVATE_KEY) updates.SYSTEM_WALLET_PRIVATE_KEY = wallet.privateKey;
  if (!env.AMOY_RPC_URL) updates.AMOY_RPC_URL = defaultRpc;
  for (const [name, value] of Object.entries(updates)) {
    const pattern = new RegExp(`^${name}=.*$`, 'gm');
    const matches = source.match(pattern) || [];
    if (matches.length > 1) throw new Error('Duplicate environment entry');
    source = matches.length ? source.replace(pattern, `${name}=${value}`) : `${source.trimEnd()}\n${name}=${value}\n`;
  }
  if (Object.keys(updates).length) {
    // Fail rather than overwriting an interrupted setup file. Never print secrets.
    const fd = fs.openSync(tempPath, 'wx', 0o600);
    try { fs.writeFileSync(fd, source); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tempPath, envPath);
  }
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, 'wallet-public.json'), JSON.stringify({ network: 'Polygon Amoy', chainId: 80002, address: wallet.address }, null, 2));
  process.stdout.write(`Amoy wallet public address: ${wallet.address}\nPrivate key saved only in ignored .env.local. Existing keys are never replaced.\n`);
  message = 'Wallet is prepared, but the RPC balance check failed. No transaction was sent. Retry setup later.';
  const rpc = env.AMOY_RPC_URL || defaultRpc;
  async function query(method, params) {
    const response = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('RPC request failed');
    const data = await response.json();
    if (data.error || !data.result) throw new Error('RPC response failed');
    return data.result;
  }
  if (BigInt(await query('eth_chainId', [])) !== 80002n) throw new Error('Wrong chain');
  const balance = BigInt(await query('eth_getBalance', [wallet.address, 'latest']));
  process.stdout.write(`Verified chain: 80002. Balance: ${formatEther(balance)} test POL.\n`);
  if (balance === 0n) process.stdout.write('Next: request free Amoy test POL for this public address, then run deploy-blockchain.ps1. Do not send real funds.\n');
  else process.stdout.write('Test POL is available. Run deploy-blockchain.ps1 to deploy or resume the contract.\n');
} catch {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
