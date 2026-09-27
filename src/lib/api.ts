import type { PublicReceipt } from './receipt'

export type PublicMetrics = {
  finalized_proofs: number
  eligible_proofs: number
  private_attributes_stored: number
}

export async function publishPublicReceipt(receipt: PublicReceipt): Promise<PublicReceipt> {
  if (!apiBase) return receipt
  const response = await fetch(`${apiBase}/receipts`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(receipt),
  })
  if (!response.ok) throw new Error(response.status === 409 ? 'This finalized receipt is already registered.' : 'The public receipt could not be registered.')
  return response.json() as Promise<PublicReceipt>
}

export async function fetchPublicReceipt(transactionId: string): Promise<PublicReceipt> {
  if (!apiBase) throw new Error('The public receipt service is not configured.')
  const response = await fetch(`${apiBase}/receipts/${encodeURIComponent(transactionId)}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(response.status === 404 ? 'Public receipt not found.' : 'The public receipt service is temporarily unavailable.')
  return response.json() as Promise<PublicReceipt>
}

const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

export async function fetchPublicMetrics(): Promise<PublicMetrics | null> {
  if (!apiBase) return null
  const response = await fetch(`${apiBase}/metrics`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('The public metrics service is temporarily unavailable.')
  return response.json() as Promise<PublicMetrics>
}
