import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetAMMAddLiquidityInputSchema = z.object({
  tokenA: z.string().describe("The contract address of the first token"),
  tokenB: z.string().describe("The contract address of the second token"),
  amountADesired: z
    .string()
    .describe("The desired amount of token A to add (in wei)"),
  amountBDesired: z
    .string()
    .describe("The desired amount of token B to add (in wei)"),
  amountAMin: z
    .string()
    .describe("The minimum amount of token A to add (in wei)"),
  amountBMin: z
    .string()
    .describe("The minimum amount of token B to add (in wei)"),
});

export class MemoryAwareTestnetAMMAddLiquidityTool extends MemoryAwareTool<
  typeof TestnetAMMAddLiquidityInputSchema
> {
  name = "memory_aware_testnet_amm_add_liquidity";
  description = `Add liquidity to a pool using the testnet AMM with memory recording.
  
  This tool allows you to add liquidity to a pool using the testnet AMM contract.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - tokenA: The contract address of the first token
  - tokenB: The contract address of the second token
  - amountADesired: The desired amount of token A to add (in wei)
  - amountBDesired: The desired amount of token B to add (in wei)
  - amountAMin: The minimum amount of token A to add (in wei)
  - amountBMin: The minimum amount of token B to add (in wei)`;
  schema = TestnetAMMAddLiquidityInputSchema;

  private readonly seiKit: SeiAgentKit;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId);
    this.seiKit = seiKit;
  }

  protected async _callRaw(
    input: z.infer<typeof TestnetAMMAddLiquidityInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `AMM add liquidity for ${input.tokenA} and ${input.tokenB}`,
      2,
    );

    console.log("Relevant memories for adding liquidity:", relevantMemories);

    // Execute the actual add liquidity
    const txHash = await this.seiKit.addAMMLiquidity(
      input.tokenA as Address,
      input.tokenB as Address,
      BigInt(input.amountADesired),
      BigInt(input.amountBDesired),
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully added liquidity. Transaction hash: ${txHash}`,
    };
  }

  /**
   * Override the recordToolExecution method to add liquidity-specific metadata
   */
  protected async recordToolExecution(
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
      amountA: parameters.amountADesired,
      amountB: parameters.amountBDesired,
      liquidity: result.liquidity || "unknown",
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
