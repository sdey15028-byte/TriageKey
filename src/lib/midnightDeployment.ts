import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api'
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js'
import {
  CostModel,
  Transaction,
  type Binding,
  type CoinPublicKey,
  type EncPublicKey,
  type FinalizedTransaction,
  type Proof,
  type SignatureEnabled,
} from '@midnight-ntwrk/midnight-js-protocol/ledger'
import { deployContract } from '@midnight-ntwrk/midnight-js/contracts'
import { setNetworkId } from '@midnight-ntwrk/midnight-js/network-id'
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js/types'
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider'
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider'
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider'
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider'
import {
  Contract,
  type EligibilityCredential,
  type Schnorr_SchnorrSignature,
  type Witnesses,
} from '../../contracts/artifacts/contract/index.js'
import type { DeploymentAdapter } from './deployment'

const PRIVATE_STATE_ID = 'triagekey-eligibility-v1'
const STORAGE_KEY = 'triagekey.midnight-storage-key.v1'
const POLICY_TEXT = 'Northside Care Mobility Program: resident age 18+ and qualifying care pathway; eligibility outcome only.'
const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n

type Attestation = {
  credential: EligibilityCredential
  signature: Schnorr_SchnorrSignature
  issuerId: bigint
}

type TriageKeyPrivateState = {
  holderSecret: Uint8Array
  attestation?: Attestation
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('The local credential secret is invalid. Replace the local record and try again.')
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function storagePassword(): string {
  let secret = localStorage.getItem(STORAGE_KEY)
  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) {
    secret = bytesToHex(crypto.getRandomValues(new Uint8Array(32)))
    localStorage.setItem(STORAGE_KEY, secret)
  }
  return `Tk!${secret.match(/.{1,3}/g)?.join('-') ?? secret}`
}

async function policyHash(): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(POLICY_TEXT)))
}

const witnesses: Witnesses<TriageKeyPrivateState> = {
  getHolderSecret: ({ privateState }) => [privateState, privateState.holderSecret],
  getEligibilityCredential: ({ privateState }) => {
    if (!privateState.attestation) {
      throw new Error('No issuer attestation is enrolled for this local credential.')
    }
    const { credential, signature, issuerId } = privateState.attestation
    return [privateState, [credential, signature, issuerId]]
  },
  getSchnorrReduction: ({ privateState }, challengeHash) => [
    privateState,
    [challengeHash / TWO_248, challengeHash % TWO_248],
  ],
}

const compiledContract = CompiledContract.make('TriageKey', Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('/'),
)

function createWalletProviders(api: ConnectedAPI, shielded: {
  shieldedCoinPublicKey: string
  shieldedEncryptionPublicKey: string
}): { walletProvider: WalletProvider; midnightProvider: MidnightProvider } {
  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shielded.shieldedCoinPublicKey as CoinPublicKey,
    getEncryptionPublicKey: () => shielded.shieldedEncryptionPublicKey as EncPublicKey,
    async balanceTx(tx) {
      const balanced = await api.balanceUnsealedTransaction(bytesToHex(tx.serialize()))
      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        hexToVariableBytes(balanced.tx),
      ) as Transaction<SignatureEnabled, Proof, Binding>
    },
  }
  const midnightProvider: MidnightProvider = {
    async submitTx(tx: FinalizedTransaction) {
      await api.submitTransaction(bytesToHex(tx.serialize()))
      const txId = tx.identifiers()[0]
      if (!txId) throw new Error('1AM submitted the transaction without returning a transaction identifier.')
      return txId
    },
  }
  return { walletProvider, midnightProvider }
}

function hexToVariableBytes(hex: string): Uint8Array {
  const normalized = hex.replace(/^0x/i, '')
  if (!normalized || normalized.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(normalized)) {
    throw new Error('1AM returned an invalid balanced transaction.')
  }
  return Uint8Array.from(normalized.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
}

export const deployWithMidnight: DeploymentAdapter = async ({ wallet, network, credential }) => {
  const configuration = await wallet.getConfiguration()
  if (configuration.networkId !== network) {
    throw new Error(`1AM is configured for ${configuration.networkId}, not ${network}.`)
  }
  setNetworkId(configuration.networkId)

  const zkConfigProvider = new FetchZkConfigProvider<keyof Contract<TriageKeyPrivateState>['provableCircuits']>(
    window.location.origin,
    window.fetch.bind(window),
  )
  const proofProvider = await dappConnectorProofProvider(wallet, zkConfigProvider, CostModel.initialCostModel())
  const publicDataProvider = indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri,
    window.WebSocket,
  )
  const shielded = await wallet.getShieldedAddresses()
  const { walletProvider, midnightProvider } = createWalletProviders(wallet, shielded)
  const privateStateProvider = levelPrivateStateProvider<typeof PRIVATE_STATE_ID, TriageKeyPrivateState>({
    privateStoragePasswordProvider: storagePassword,
    accountId: shielded.shieldedAddress,
    cryptoBackend: 'webcrypto',
  })

  const deployed = await deployContract(
    { privateStateProvider, publicDataProvider, zkConfigProvider, proofProvider, walletProvider, midnightProvider },
    {
      compiledContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: { holderSecret: hexToBytes(credential.secretHex) },
      args: [await policyHash()],
    },
  )
  const { contractAddress, txId, txHash, blockHeight, blockTimestamp } = deployed.deployTxData.public
  return {
    public: {
      contractAddress: String(contractAddress),
      txId: String(txId),
      txHash: String(txHash),
      blockHeight,
      blockTimestamp,
    },
  }
}
