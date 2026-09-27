import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearPublicReceipt,
  loadPublicReceipt,
  receiptFromFinalizedDeployment,
  savePublicReceipt,
  transactionExplorerUrl,
} from '../src/lib/receipt'

const deployment = {
  public: {
    contractAddress: 'a'.repeat(64),
    txId: `tx_${'b'.repeat(61)}`,
    txHash: `0x${'c'.repeat(64)}`,
    blockHeight: 1452,
    blockTimestamp: 1_780_000_000,
  },
}

describe('finalized public receipts', () => {
  beforeEach(clearPublicReceipt)

  it('extracts only public identifiers from finalized deployment data', () => {
    const receipt = receiptFromFinalizedDeployment(deployment, 'preview')
    expect(receipt.contract_address).toBe(deployment.public.contractAddress)
    expect(receipt.transaction_hash).toBe(deployment.public.txHash)
    expect(receipt.transaction_id).toBe(deployment.public.txId)
    expect(receipt.receipt_type).toBe('deployment')
    expect(receipt.nullifier).toBeNull()
  })

  it('persists a validated receipt across a page refresh', () => {
    const receipt = receiptFromFinalizedDeployment(deployment, 'preprod')
    savePublicReceipt(receipt)
    expect(loadPublicReceipt()).toEqual(receipt)
    expect(transactionExplorerUrl(receipt)).toContain('preprod.midnightexplorer.com/transactions/')
  })

  it('rejects placeholder identifiers', () => {
    expect(() => receiptFromFinalizedDeployment({ ...deployment, public: { ...deployment.public, contractAddress: 'your_contract_address' } }, 'preview')).toThrow(/Contract address/)
  })
})
