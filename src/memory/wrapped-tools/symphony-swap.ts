import { SeiAgentKit } from "../../agent";
import { swap } from "../../tools/symphony/swap";
import { Address } from "viem";
import { MemoryManager } from "../manager";

/**
 * Wrapped version of the Symphony swap function that automatically records
 * successful transactions as memories
 * @param agent SeiAgentKit instance
 * @param amount The amount of tokens to swap as a string (e.g., "1.5")
 * @param tokenIn The address of the token to swap from
 * @param tokenOut The address of the token to swap to
 * @param memoryManager The memory manager to use for recording memories
 * @param userId The ID of the user performing the swap
 * @returns Transaction details as a string
 */
export async function wrappedSymphonySwap(
  agent: SeiAgentKit,
  amount: string,
  tokenIn: Address,
  tokenOut: Address,
  memoryManager: MemoryManager,
  userId: string,
): Promise<string> {
  try {
    console.log(`Swapping ${amount} ${tokenIn} to ${tokenOut}...`);
    
    // Call the original swap function
    const result = await swap(agent, amount, tokenIn, tokenOut);
    
    // If successful, record the transaction as a memory
    // Check if the result is a transaction hash (success) or an error object
    if (typeof result === 'string' && !result.startsWith('{')) {
      // This is a successful transaction hash
      const memoryContent = `Successfully swapped ${amount} ${tokenIn} for ${tokenOut} on Symphony.`;
      
      await memoryManager.addMemory({
        content: memoryContent,
        type: 'transaction_record',
        importance: 0.8, // High importance for successful transactions
        metadata: {
          userId: userId,
          protocol: 'Symphony',
          fromToken: tokenIn,
          toToken: tokenOut,
          hash: result, // The transaction hash
        },
      });
      
      console.log('Transaction recorded in memory');
    } else {
      console.log('Swap failed, not recording in memory');
    }
    
    return result;
  } catch (err) {
    console.error('Error in wrappedSymphonySwap:', err);
    return JSON.stringify({
      status: "error",
      message: err instanceof Error ? err.message : String(err),
      code: err instanceof Error && 'code' in err ? (err as any).code : "UNKNOWN_ERROR"
    });
  }
}