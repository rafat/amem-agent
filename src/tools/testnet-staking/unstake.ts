import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Unstakes tokens from the testnet staking contract
 * @param agent SeiAgentKit instance
 * @param stakingToken Address of the token to unstake
 * @param amount Amount of tokens to unstake (in wei)
 * @returns Transaction hash
 */
export async function unstakeTokens(
  agent: SeiAgentKit,
  stakingToken: Address,
  amount: bigint
): Promise<string> {
  console.log(`Unstaking ${amount} tokens of ${stakingToken}...`);
  
  try {
    // Prepare the unstaking parameters
    // Based on the Staking.sol contract, we need to call the unstake function
    const data = encodeFunctionData({
      abi: STAKING_ABI,
      functionName: 'unstake',
      args: [stakingToken, amount]
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
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
