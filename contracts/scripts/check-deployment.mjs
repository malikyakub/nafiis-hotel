// Read-only deployment preflight. Reports setting names, never credentials.
import { Wallet, isAddress, Contract, JsonRpcProvider, FetchRequest } from 'ethers';
const missing=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SITE_URL','AMOY_RPC_URL','SYSTEM_WALLET_PRIVATE_KEY','PROOF_REGISTRY_ADDRESS'].filter(k=>!process.env[k]?.trim());
if(!process.env.SUPABASE_SECRET_KEY&&!process.env.SUPABASE_SERVICE_ROLE_KEY)missing.push('SUPABASE_SECRET_KEY');
if(missing.length){process.stderr.write(`Missing settings: ${missing.join(', ')}\n`);process.exitCode=1;}
let provider;
try{
 if(missing.length===0){
  const site=new URL(process.env.SITE_URL);
  if(site.protocol!=='https:'||site.username||site.password||site.pathname!=='/'||site.search||site.hash)throw new Error('SITE_URL must be an exact HTTPS origin');
  if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).protocol!=='https:')throw new Error('Supabase URL must be HTTPS');
  if(!isAddress(process.env.PROOF_REGISTRY_ADDRESS))throw new Error('Invalid registry address');
  const request=new FetchRequest(process.env.AMOY_RPC_URL);request.timeout=12000;
  provider=new JsonRpcProvider(request,undefined,{batchMaxCount:1,cacheTimeout:-1});
  const wallet=new Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY);
  if((await provider.getNetwork()).chainId!==80002n)throw new Error('Wrong chain');
  if(await provider.getCode(process.env.PROOF_REGISTRY_ADDRESS)==='0x')throw new Error('No deployed registry');
  const registry=new Contract(process.env.PROOF_REGISTRY_ADDRESS,['function registrar() view returns(address)'],provider);
  if(await registry.registrar()!==wallet.address)throw new Error('Registrar mismatch');
  if(await provider.getBalance(wallet.address)===0n)throw new Error('Test wallet is empty');
  process.stdout.write('PASS: required settings, HTTPS origin, Amoy chain, deployed registry, registrar and nonzero test POL.\n');
  process.stdout.write('Still verify the host deployment, Supabase redirect allowlist, reset email and actual booking on the final domain.\n');
 }
}catch{process.stderr.write('Preflight failed. Check SITE_URL, Supabase URL, Amoy RPC, wallet balance and registry/registrar configuration locally. No secret values logged.\n');process.exitCode=1;}
finally{provider?.destroy();}
