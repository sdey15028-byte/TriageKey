export type PublicMetrics = {
  finalized_proofs: number
  eligible_proofs: number
  private_attributes_stored: number
}

const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function fetchPublicMetrics(): Promise<PublicMetrics | null> {
  if (!apiBase) return null
  const response = await fetch(`${apiBase}/metrics`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('The public metrics service is temporarily unavailable.')
  return response.json() as Promise<PublicMetrics>
}
