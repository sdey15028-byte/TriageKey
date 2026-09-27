import { describe, expect, it } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
const source = readFileSync('contracts/TriageKey.compact', 'utf8')
describe('Compact privacy boundaries', () => {
  it('contains public ledger and private witness declarations', () => { expect(source).toMatch(/export ledger/); expect(source).toMatch(/witness getHolderSecret/) })
  it('uses a nullifier and rejects replay', () => { expect(source).toMatch(/usedNullifiers/); expect(source).toMatch(/assert\(!usedNullifiers\.member/) })
  it('documents and limits disclosure to the Boolean output', () => expect(source).toMatch(/disclose\(true\)/))
  it('exposes policy, issuer and eligibility circuits', () => {
    expect(source).toMatch(/circuit proveEligibility/)
    expect(source).toMatch(/circuit registerIssuer/)
    expect(source).toMatch(/circuit setPolicy/)
  })
  it('ships non-placeholder prover and verifier artifacts', () => {
    expect(statSync('contracts/artifacts/keys/proveEligibility.prover').size).toBeGreaterThan(1_000_000)
    expect(statSync('contracts/artifacts/keys/proveEligibility.verifier').size).toBeGreaterThan(1_000)
    expect(statSync('contracts/artifacts/zkir/proveEligibility.bzkir').size).toBeGreaterThan(100)
  })
})
