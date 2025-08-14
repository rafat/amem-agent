import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";

/**
 * Claims rewards from the testnet staking contract
 * @param agent SeiAgentKit instance
 * @param stakingToken Address of the staking token
 * @returns Transaction hash
 */
export async function claimStakingRewards(
  agent: SeiAgentKit,
  stakingToken: Address
): Promise<string> {
  console.log(`Claiming rewards for staking token ${stakingToken}...`);
  
  try {
    // Prepare the claim parameters
    // Based on the Staking.sol contract, we need to call the claimReward function
    const data = encodeFunctionData({
      abi: STAKING_ABI,
      functionName: 'claimReward',
      args: [stakingToken]
    });

    // For now, we'll use a placeholder address for the staking contract
    // This should be updated with the actual deployed contract address
    const stakingContractAddress = "0x0000000000000000000000000000000000000000" as Address;

    // Send the transaction
    const txHash = await sendTransaction({
      agent,
      to: stakingContractAddress,
      data,
    });

    if (!txHash) {
      throw new Error("Transaction was executed but no hash was returned");
    }

    return txHash;
  } catch (error) {
    const errorMsg = error instanceof Error ? error?.message : String(error);
    console.error(errorMsg);
    throw error;
  }
}

// TODO: Replace with actual ABI from the Staking contract
const STAKING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_stakingToken",
        "type": "address"
      }
    ],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
