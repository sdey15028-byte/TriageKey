const KEY = 'triagekey.local-credential.v1'
export type LocalCredential = { label: string; issuedAt: string; keyId: string; secretHex: string }

function randomSecretHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createCredential(issuedAt: string): LocalCredential {
  const secretHex = randomSecretHex()
  return {
    label: 'TriageKey contract key',
    issuedAt,
    keyId: `local••••••${secretHex.slice(-2).toUpperCase()}`,
    secretHex,
  }
}

function isCredential(value: unknown): value is LocalCredential {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LocalCredential>
  return typeof candidate.label === 'string'
    && typeof candidate.issuedAt === 'string'
    && typeof candidate.keyId === 'string'
    && typeof candidate.secretHex === 'string'
    && /^[0-9a-f]{64}$/i.test(candidate.secretHex)
}

export function loadCredential(): LocalCredential {
  const saved = localStorage.getItem(KEY)
  if (saved) {
    try {
      const value: unknown = JSON.parse(saved)
      if (isCredential(value)) return value
    } catch {
      // Replace malformed or legacy state with a fresh device-only credential.
    }
  }
  const credential = createCredential('Created in this browser profile')
  localStorage.setItem(KEY, JSON.stringify(credential))
  return credential
}
export function rotateCredential(): LocalCredential {
  const credential = createCredential('Replaced in this browser just now')
  localStorage.setItem(KEY, JSON.stringify(credential))
  return credential
}
export function clearCredential() { localStorage.removeItem(KEY) }
