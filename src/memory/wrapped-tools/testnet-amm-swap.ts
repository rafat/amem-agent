import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetAMMSwapInputSchema = z.object({
  tokenIn: z.string().describe("The contract address of the input token to swap from"),
  tokenOut: z.string().describe("The contract address of the output token to swap to"),
  amountIn: z.string().describe("The amount of input tokens to swap (in wei)"),
});

export class MemoryAwareTestnetAMMSwapTool extends MemoryAwareTool<typeof TestnetAMMSwapInputSchema> {
  name = "memory_aware_testnet_amm_swap";
  description = `Swap tokens using the testnet AMM with memory recording.
  
  This tool allows you to swap one token for another using the testnet AMM contract.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - tokenIn: The contract address of the input token to swap from
  - tokenOut: The contract address of the output token to swap to
  - amountIn: The amount of input tokens to swap (in wei)`;
  schema = TestnetAMMSwapInputSchema;

  constructor(seiKit: SeiAgentKit, memoryManager: MemoryManager, userId: string) {
    super(memoryManager, userId, seiKit);
  }

  protected async _callRaw(input: z.infer<typeof TestnetAMMSwapInputSchema>): Promise<any> {
    try {
      // Get relevant memories for context
      const relevantMemories = await this.getRelevantMemories(
        `AMM swap from ${input.tokenIn} to ${input.tokenOut}`, 
        2
      );
      
      console.log("Relevant memories for this swap:", relevantMemories);

      // Execute the actual swap
      const txHash = await this.seiKit.swapTokens(
        input.tokenIn as Address,
        input.tokenOut as Address,
        BigInt(input.amountIn)
      );

      return {
        status: "success",
        transactionHash: txHash,
        message: `Successfully swapped tokens. Transaction hash: ${txHash}`,
      };
    } catch (error: any) {
      throw error;
    }
  }
  
  /**
   * Override the recordToolExecution method to add swap-specific metadata
   */
  protected async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Add swap-specific metadata
    const swapMetadata = {
      ...metadata,
      fromToken: parameters.tokenIn,
      toToken: parameters.tokenOut,
      amount: parameters.amountIn,
    };
    
    // Call the parent method with enhanced metadata
    await super.recordToolExecution(action, parameters, result, swapMetadata);
  }
}
