import { readFileSync, statSync } from 'node:fs'

const circuits = ['proveEligibility', 'registerIssuer', 'removeIssuer', 'setPolicy']
const required = [
  ['contracts/artifacts/contract/index.js', 10_000],
  ['contracts/artifacts/compiler/contract-info.json', 1_000],
  ...circuits.flatMap((circuit) => [
    [`contracts/artifacts/keys/${circuit}.prover`, 100_000],
    [`contracts/artifacts/keys/${circuit}.verifier`, 100],
    [`contracts/artifacts/zkir/${circuit}.bzkir`, 100],
  ]),
]

for (const [path, minimumBytes] of required) {
  let size = 0
  try {
    size = statSync(path).size
  } catch {
    // The consolidated error below gives the same actionable command for every missing file.
  }
  if (size < minimumBytes) {
    throw new Error(`Missing or invalid Compact artifact: ${path}. Run npm run contracts:compile before building.`)
  }
}

const metadata = JSON.parse(readFileSync('contracts/artifacts/compiler/contract-info.json', 'utf8'))
if (metadata['compiler-version'] !== '0.31.1' || metadata['runtime-version'] !== '0.16.0') {
  throw new Error('Compact artifacts were not generated with compiler 0.31.1 and runtime 0.16.0.')
}

console.log(`Verified ${required.length} compiled Compact artifacts.`)
