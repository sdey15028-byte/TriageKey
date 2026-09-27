import { beforeEach, describe, expect, it } from 'vitest'
import { clearCredential, loadCredential, rotateCredential } from '../src/lib/privateState'
describe('local private state', () => {
  beforeEach(clearCredential)
  it('loads a device-only default without a record', () => expect(loadCredential().keyId).toMatch(/^local/))
  it('rotates and persists a replacement record', () => { const record = rotateCredential(); expect(loadCredential().keyId).toBe(record.keyId) })
})
