import type { Network } from './wallet'

const STORAGE_KEY = 'triagekey.public-receipt.v1'
export const PUBLIC_RECEIPT_EVENT = 'triagekey:public-receipt'
const HEX_32_BYTES = /^(?:0x)?[0-9a-f]{64}$/i

export type PublicReceipt = {
  transaction_id: string
  transaction_hash: string
  contract_address: string
  receipt_type: 'deployment' | 'proof'
  disclosure_scope: 'eligible' | 'ineligible' | null
  nullifier: string | null
  network: Network
  block_height: number | null
  finalized_at: string
}

/** The only deployment fields that may cross the privacy boundary. */
export type FinalizedDeploymentPublicData = {
  public: {
    contractAddress: string
    txId: string
    txHash: string
    blockHeight: number
    blockTimestamp: number
  }
}

function assertPublicIdentifier(value: unknown, label: string, strictHex = false): asserts value is string {
  if (typeof value !== 'string' || value.length < 16 || value.length > 128 || /placeholder|example|your_|secret|witness/i.test(value)) {
    throw new Error(`${label} is missing from the finalized Midnight transaction.`)
  }
  if (strictHex && !HEX_32_BYTES.test(value)) throw new Error(`${label} is not a 32-byte Midnight identifier.`)
}

export function receiptFromFinalizedDeployment(data: FinalizedDeploymentPublicData, network: Network): PublicReceipt {
  const { contractAddress, txId, txHash, blockHeight, blockTimestamp } = data.public
  assertPublicIdentifier(contractAddress, 'Contract address', true)
  assertPublicIdentifier(txId, 'Transaction ID')
  assertPublicIdentifier(txHash, 'Transaction hash', true)
  if (!Number.isSafeInteger(blockHeight) || blockHeight < 0) throw new Error('Finalized block height is invalid.')
  if (!Number.isFinite(blockTimestamp) || blockTimestamp <= 0) throw new Error('Finalized block timestamp is invalid.')

  const timestampMs = blockTimestamp < 1_000_000_000_000 ? blockTimestamp * 1000 : blockTimestamp
  const finalizedAt = new Date(timestampMs)
  if (Number.isNaN(finalizedAt.valueOf())) throw new Error('Finalized block timestamp is invalid.')

  return {
    transaction_id: txId,
    transaction_hash: txHash,
    contract_address: contractAddress,
    receipt_type: 'deployment',
    disclosure_scope: null,
    nullifier: null,
    network,
    block_height: blockHeight,
    finalized_at: finalizedAt.toISOString(),
  }
}

export function isPublicReceipt(value: unknown): value is PublicReceipt {
  if (!value || typeof value !== 'object') return false
  const receipt = value as Partial<PublicReceipt>
  const finalizedAt = typeof receipt.finalized_at === 'string' ? Date.parse(receipt.finalized_at) : Number.NaN
  const disclosureMatchesType = receipt.receipt_type === 'deployment'
    ? receipt.disclosure_scope === null && receipt.nullifier === null
    : (receipt.disclosure_scope === 'eligible' || receipt.disclosure_scope === 'ineligible') && typeof receipt.nullifier === 'string'
  return typeof receipt.transaction_id === 'string'
    && receipt.transaction_id.length >= 16
    && receipt.transaction_id.length <= 128
    && !/placeholder|example|your_|secret|witness/i.test(receipt.transaction_id)
    && typeof receipt.transaction_hash === 'string'
    && HEX_32_BYTES.test(receipt.transaction_hash)
    && typeof receipt.contract_address === 'string'
    && HEX_32_BYTES.test(receipt.contract_address)
    && (receipt.receipt_type === 'deployment' || receipt.receipt_type === 'proof')
    && disclosureMatchesType
    && (receipt.network === 'preview' || receipt.network === 'preprod')
    && (receipt.block_height === null || (Number.isSafeInteger(receipt.block_height) && Number(receipt.block_height) >= 0))
    && Number.isFinite(finalizedAt)
}

export function savePublicReceipt(receipt: PublicReceipt): void {
  if (!isPublicReceipt(receipt)) throw new Error('Only a validated public receipt can be saved.')
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipt))
}

export function announcePublicReceipt(receipt: PublicReceipt): void {
  savePublicReceipt(receipt)
  window.dispatchEvent(new window.CustomEvent(PUBLIC_RECEIPT_EVENT, { detail: receipt }))
}

export function loadPublicReceipt(): PublicReceipt | null {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  try {
    const value: unknown = JSON.parse(saved)
    if (isPublicReceipt(value)) return value
  } catch {
    // A corrupt local receipt is discarded below.
  }
  localStorage.removeItem(STORAGE_KEY)
  return null
}

export function clearPublicReceipt(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function shortenIdentifier(value: string): string {
  return value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-10)}` : value
}

export function transactionExplorerUrl(receipt: PublicReceipt): string {
  const origin = receipt.network === 'preprod' ? 'https://preprod.midnightexplorer.com' : 'https://preview.midnightexplorer.com'
  return `${origin}/transactions/${encodeURIComponent(receipt.transaction_hash)}`
}
