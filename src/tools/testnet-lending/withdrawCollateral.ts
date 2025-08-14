import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";

/**
 * Withdraws collateral from the testnet lending pool
 * @param agent SeiAgentKit instance
 * @param collateralToken Address of the collateral token
 * @param amount Amount of collateral to withdraw (in wei)
 * @returns Transaction hash
 */
export async function withdrawCollateral(
  agent: SeiAgentKit,
  collateralToken: Address,
  amount: bigint
): Promise<string> {
  console.log(`Withdraw ${amount} collateral tokens of ${collateralToken}...`);
  
  try {
    // Prepare the withdraw parameters
    // Based on the LendingPool.sol contract, we need to call a function to withdraw collateral
    const data = encodeFunctionData({
      abi: LENDING_ABI,
      functionName: 'withdrawCollateral',
      args: [collateralToken, amount]
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
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
