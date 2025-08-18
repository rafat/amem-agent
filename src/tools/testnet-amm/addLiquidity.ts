import { SeiAgentKit } from "../../index";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Adds liquidity to the testnet AMM
 * @param agent SeiAgentKit instance
 * @param tokenA Address of the first token
 * @param tokenB Address of the second token
 * @param amountA Amount of tokenA to add (in wei)
 * @param amountB Amount of tokenB to add (in wei)
 * @returns Transaction hash
 */
export async function addAMMLiquidity(
  agent: SeiAgentKit,
  tokenA: Address,
  tokenB: Address,
  amountA: bigint,
  amountB: bigint
): Promise<string> {
  console.log(`Adding liquidity: ${amountA} of ${tokenA} and ${amountB} of ${tokenB}...`);
  
  try {
    // Prepare the add liquidity parameters
    // Based on the AMM.sol contract, we need to call a function to add liquidity
    const data = encodeFunctionData({
      abi: AMM_ABI,
      functionName: 'addLiquidity',
      args: [tokenA, tokenB, amountA, amountB]
    });

    // Use the actual AMM contract address from environment variables
    const ammContractAddress = process.env.AMM_ADDRESS as Address;
    if (!ammContractAddress) {
      throw new Error("AMM_ADDRESS environment variable is not set");
    }

    // Send the transaction
    const txHash = await sendTransaction({
      agent,
      to: ammContractAddress,
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

// TODO: Replace with actual ABI from the AMM contract
const AMM_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenB",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amountA",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_amountB",
        "type": "uint256"
      }
    ],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
