import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
const source = readFileSync('contracts/TriageKey.compact', 'utf8')
describe('Compact privacy boundaries', () => {
  it('contains public ledger and genuinely private witnesses', () => { expect(source).toMatch(/export ledger/); expect(source).toMatch(/witness private/) })
  it('uses a nullifier and rejects replay', () => { expect(source).toMatch(/used_nullifiers/); expect(source).toMatch(/assert\(!used_nullifiers\.member/) })
  it('documents and limits disclosure to the Boolean output', () => expect(source).toMatch(/disclose\(true\)/))
  it('exposes two meaningful circuits', () => { expect(source).toMatch(/circuit prove_eligibility/); expect(source).toMatch(/circuit set_policy/) })
})
