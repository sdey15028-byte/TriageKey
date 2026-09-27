const KEY = 'triagekey.local-credential.v1'
export type LocalCredential = { label: string; issuedAt: string; keyId: string }

export function loadCredential(): LocalCredential {
  const saved = localStorage.getItem(KEY)
  return saved ? JSON.parse(saved) as LocalCredential : { label: 'Care eligibility credential', issuedAt: 'Stored only on this device', keyId: 'local••••••7A' }
}
export function rotateCredential(): LocalCredential {
  const credential = { label: 'Care eligibility credential', issuedAt: 'Replaced locally just now', keyId: `local••••••${crypto.randomUUID().slice(-2).toUpperCase()}` }
  localStorage.setItem(KEY, JSON.stringify(credential))
  return credential
}
export function clearCredential() { localStorage.removeItem(KEY) }
