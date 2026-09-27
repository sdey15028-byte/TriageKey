import { beforeEach, describe, expect, it } from 'vitest'
import { classifyWalletError, connectWallet, discoverWallets, type WalletSession } from '../src/lib/wallet'

const session = (network: string): WalletSession => ({
  getConnectionStatus: async () => ({ status: 'connected', networkId: network }),
  getConfiguration: async () => ({ networkId: network, indexerUri: '', indexerWsUri: '', substrateNodeUri: '' }),
} as WalletSession)

describe('wallet discovery', () => {
  beforeEach(() => { window.midnight = {} })
  it('discovers UUID-keyed providers and prefers 1AM', () => {
    window.midnight = { other: { name: 'Other', apiVersion: '4.0.1', connect: async () => session('preview') }, 'uuid-1': { name: '1AM', apiVersion: '4.0.1', connect: async () => session('preview') } }
    expect(discoverWallets().map((item) => item.name)).toEqual(['1AM', 'Other'])
  })
  it('connects with the requested network', async () => {
    let network = ''
    window.midnight = { one: { name: '1AM', apiVersion: '4.0.1', connect: async (value) => { network = value; return session(value) } } }
    await connectWallet('preprod'); expect(network).toBe('preprod')
  })
  it('classifies a wallet rejection without claiming a transaction', () => expect(classifyWalletError(new Error('user rejected'))).toMatch(/did not leave/))
})
