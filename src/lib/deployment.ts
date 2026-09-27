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

let deploymentAdapter: DeploymentAdapter | null = null

/** Generated Compact bindings register their real deployment implementation here. */
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

  await input.wallet.hintUsage(['getProvingProvider', 'balanceUnsealedTransaction', 'submitTransaction'])
  if (!deploymentAdapter) {
    throw new Error('The Compact contract artifacts are not compiled yet. No transaction was created and no identifier was fabricated.')
  }

  const finalized = await deploymentAdapter(input)
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
