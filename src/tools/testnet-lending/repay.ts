import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";

/**
 * Repays borrowed tokens to the testnet lending pool
 * @param agent SeiAgentKit instance
 * @param collateralToken Address of the collateral token
 * @param borrowToken Address of the borrowed token
 * @param amount Amount of tokens to repay (in wei)
 * @returns Transaction hash
 */
export async function repayBorrowedTokens(
  agent: SeiAgentKit,
  collateralToken: Address,
  borrowToken: Address,
  amount: bigint
): Promise<string> {
  console.log(`Repaying ${amount} borrowed tokens of ${borrowToken}...`);
  
  try {
    // Prepare the repay parameters
    // Based on the LendingPool.sol contract, we need to call the repay function
    const data = encodeFunctionData({
      abi: LENDING_ABI,
      functionName: 'repay',
      args: [collateralToken, borrowToken, amount]
    });

    // For now, we'll use a placeholder address for the lending contract
    // This should be updated with the actual deployed contract address
    const lendingContractAddress = "0x0000000000000000000000000000000000000000" as Address;

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
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
