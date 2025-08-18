import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Borrows tokens from the testnet lending pool
 * @param agent SeiAgentKit instance
 * @param collateralToken Address of the collateral token
 * @param borrowToken Address of the token to borrow
 * @param amount Amount of tokens to borrow (in wei)
 * @returns Transaction hash
 */
export async function borrowTokens(
  agent: SeiAgentKit,
  collateralToken: Address,
  borrowToken: Address,
  amount: bigint
): Promise<string> {
  console.log(`Borrowing ${amount} tokens of ${borrowToken} using ${collateralToken} as collateral...`);
  
  try {
    // Prepare the borrow parameters
    // Based on the LendingPool.sol contract, we need to call the borrow function
    const data = encodeFunctionData({
      abi: LENDING_ABI,
      functionName: 'borrow',
      args: [collateralToken, borrowToken, amount]
    });

    // Use the actual lending contract address from environment variables
    const lendingContractAddress = process.env.LENDING_POOL_ADDRESS as Address;
    if (!lendingContractAddress) {
      throw new Error("LENDING_POOL_ADDRESS environment variable is not set");
    }

    // Send the transaction
    const txHash = await sendTransaction({
      agent,
      to: lendingContractAddress,
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

// TODO: Replace with actual ABI from the LendingPool contract
const LENDING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_collateralToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_borrowToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
