import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import solc from 'solc';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'contracts/BookingProofRegistry.sol'), 'utf8');
const result = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity', sources: { 'BookingProofRegistry.sol': { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
})));
if (result.errors?.some(e => e.severity === 'error')) {
  process.stderr.write(result.errors.map(e => e.formattedMessage).join('\n'));
  process.exit(1);
}
export const artifact = result.contracts['BookingProofRegistry.sol'].BookingProofRegistry;
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/BookingProofRegistry.json'), JSON.stringify(artifact, null, 2));
process.stdout.write('BookingProofRegistry compiled.\n');
