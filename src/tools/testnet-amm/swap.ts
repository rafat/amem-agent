import { SeiAgentKit } from "../../agent";
import { Address, encodeFunctionData } from "viem";
import { sendTransaction } from "../../utils/transaction";

/**
 * Swaps tokens in the testnet AMM
 * @param agent SeiAgentKit instance
 * @param tokenIn Address of the input token
 * @param tokenOut Address of the output token
 * @param amountIn Amount of input tokens to swap (in wei)
 * @returns Transaction hash
 */
export async function swapTokens(
  agent: SeiAgentKit,
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<string> {
  console.log(`Swapping ${amountIn} of ${tokenIn} for ${tokenOut}...`);
  
  try {
    // Prepare the swap parameters
    // Based on the AMM.sol contract, we need to call a function to swap tokens
    const data = encodeFunctionData({
      abi: AMM_ABI,
      functionName: 'swap',
      args: [tokenIn, tokenOut, amountIn]
    });

    // For now, we'll use a placeholder address for the AMM contract
    // This should be updated with the actual deployed contract address
    const ammContractAddress = "0x0000000000000000000000000000000000000000" as Address;

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
        "name": "_tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amountIn",
        "type": "uint256"
      }
    ],
    "name": "swap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
