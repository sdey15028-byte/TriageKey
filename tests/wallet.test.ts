import { beforeEach, describe, expect, it } from 'vitest'
import { classifyWalletError, connectWallet, discoverWallets } from '../src/lib/wallet'

describe('wallet discovery', () => {
  beforeEach(() => { window.midnight = {} })
  it('discovers UUID-keyed providers and prefers 1AM', () => {
    window.midnight = { other: { name: 'Other', connect: async () => ({}) }, 'uuid-1': { name: '1AM', apiVersion: '4.0.1', connect: async () => ({}) } }
    expect(discoverWallets().map((item) => item.name)).toEqual(['1AM', 'Other'])
  })
  it('connects with the requested network', async () => {
    let network = ''
    window.midnight = { one: { name: '1AM', connect: async (value) => { network = value; return { ok: true } } } }
    await connectWallet('preprod'); expect(network).toBe('preprod')
  })
  it('classifies a wallet rejection without claiming a transaction', () => expect(classifyWalletError(new Error('user rejected'))).toMatch(/did not leave/))
})
