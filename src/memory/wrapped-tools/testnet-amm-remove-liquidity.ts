import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetAMMRemoveLiquidityInputSchema = z.object({
  tokenA: z.string().describe("The contract address of the first token"),
  tokenB: z.string().describe("The contract address of the second token"),
  liquidity: z
    .string()
    .describe("The amount of liquidity tokens to remove (in wei)"),
  amountAMin: z
    .string()
    .describe("The minimum amount of token A to receive (in wei)"),
  amountBMin: z
    .string()
    .describe("The minimum amount of token B to receive (in wei)"),
});

export class MemoryAwareTestnetAMMRemoveLiquidityTool extends MemoryAwareTool<
  typeof TestnetAMMRemoveLiquidityInputSchema
> {
  name = "memory_aware_testnet_amm_remove_liquidity";
  description = `Remove liquidity from a pool using the testnet AMM with memory recording.
  
  This tool allows you to remove liquidity from a pool using the testnet AMM contract.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - tokenA: The contract address of the first token
  - tokenB: The contract address of the second token
  - liquidity: The amount of liquidity tokens to remove (in wei)
  - amountAMin: The minimum amount of token A to receive (in wei)
  - amountBMin: The minimum amount of token B to receive (in wei)`;
  schema = TestnetAMMRemoveLiquidityInputSchema;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(
    input: z.input<typeof TestnetAMMRemoveLiquidityInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `AMM remove liquidity for ${input.tokenA} and ${input.tokenB}`,
      2,
    );

    console.log("Relevant memories for removing liquidity:", relevantMemories);

    // Execute the actual remove liquidity
    const txHash = await this.seiKit.removeLiquidity(
      input.tokenA as Address,
      input.tokenB as Address,
      BigInt(input.liquidity),
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully removed liquidity. Transaction hash: ${txHash}`,
    };
  }

  /**
   * Override the recordToolExecution method to add AMM-specific metadata
   */
  protected override async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add liquidity-specific metadata
    const liquidityMetadata = {
      ...metadata,
      tokenA: parameters.tokenA,
      tokenB: parameters.tokenB,
      liquidity: parameters.liquidity,
    };

    // Call the parent method with enhanced metadata
    await super.recordToolExecution(
      action,
      parameters,
      result,
      liquidityMetadata,
    );
  }
}
