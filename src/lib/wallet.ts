import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api'

export type Network = 'preview' | 'preprod'
export type WalletState = 'idle' | 'connecting' | 'connected' | 'unsupported' | 'rejected' | 'error'

export type WalletSession = ConnectedAPI
export type DiscoveredWallet = { id: string; name: string; apiVersion: string; connect: InitialAPI['connect'] }

export function discoverWallets(): DiscoveredWallet[] {
  return Object.entries(window.midnight ?? {}).map(([id, wallet]) => ({
    id, name: wallet.name ?? 'Unnamed Midnight wallet', apiVersion: wallet.apiVersion ?? 'unknown', connect: wallet.connect,
  })).sort((a, b) => Number(/1am/i.test(b.name)) - Number(/1am/i.test(a.name)))
}

export async function connectWallet(network: Network): Promise<{ wallet: DiscoveredWallet; session: WalletSession }> {
  const wallet = discoverWallets()[0]
  if (!wallet) throw new Error('No Midnight wallet was found. Install and unlock 1AM, then try again.')
  if (!/^4\./.test(wallet.apiVersion)) throw new Error(`The wallet uses unsupported DApp Connector API ${wallet.apiVersion}. TriageKey requires version 4.x.`)
  const session = await wallet.connect(network)
  const status = await session.getConnectionStatus()
  const configuration = await session.getConfiguration()
  if (status.status !== 'connected' || status.networkId !== network || configuration.networkId !== network) {
    throw new Error(`1AM connected to ${configuration.networkId}, but TriageKey requested ${network}.`)
  }
  return { wallet, session }
}

export function classifyWalletError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error)
  if (/reject|denied|cancel/i.test(text)) return 'Wallet request was rejected. Your private record did not leave this device.'
  if (/dust|balance/i.test(text)) return 'Insufficient DUST to prove this request. Fund DUST in 1AM and try again.'
  if (/proof|proving/i.test(text)) return 'The proving service is unavailable. No transaction was submitted.'
  if (/indexer/i.test(text)) return 'The indexer is delayed. Check the wallet’s configured indexer and retry.'
  return 'The wallet could not connect. No transaction was submitted.'
}
