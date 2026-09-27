import type { LocalCredential } from './privateState'
import { publishPublicReceipt } from './api'
import {
  announcePublicReceipt,
  receiptFromFinalizedDeployment,
  type FinalizedDeploymentPublicData,
  type PublicReceipt,
} from './receipt'
import type { Network, WalletSession } from './wallet'

export type DeploymentAdapter = (input: {
  wallet: WalletSession
  network: Network
  credential: LocalCredential
}) => Promise<FinalizedDeploymentPublicData>

let deploymentAdapter: DeploymentAdapter | undefined

/** Tests or alternate runtimes can replace the built-in Midnight deployment implementation. */
export function registerDeploymentAdapter(adapter: DeploymentAdapter): void {
  deploymentAdapter = adapter
}

export async function deployEligibilityContract(input: {
  wallet: WalletSession
  network: Network
  credential: LocalCredential
}): Promise<{ receipt: PublicReceipt; registered: boolean }> {
  const status = await input.wallet.getConnectionStatus()
  if (status.status !== 'connected' || status.networkId !== input.network) {
    throw new Error(`1AM is no longer connected to ${input.network}. Reconnect before deploying.`)
  }

  await input.wallet.hintUsage([
    'getShieldedAddresses',
    'getProvingProvider',
    'balanceUnsealedTransaction',
    'submitTransaction',
  ])
  const adapter = deploymentAdapter ?? (await import('./midnightDeployment')).deployWithMidnight
  const finalized = await adapter(input)
  const receipt = receiptFromFinalizedDeployment(finalized, input.network)
  announcePublicReceipt(receipt)

  try {
    await publishPublicReceipt(receipt)
    return { receipt, registered: true }
  } catch {
    // The on-chain receipt remains useful even if the optional public registry is unavailable.
    return { receipt, registered: false }
  }
}
