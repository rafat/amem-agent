import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";
import * as dotenv from 'dotenv';

dotenv.config();

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

    // Use the actual staking contract address from environment variables
    const stakingContractAddress = process.env.STAKING_ADDRESS as Address;
    if (!stakingContractAddress) {
      throw new Error("STAKING_ADDRESS environment variable is not set");
    }

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
