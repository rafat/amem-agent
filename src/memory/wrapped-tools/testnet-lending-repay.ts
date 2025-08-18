import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetLendingRepayInputSchema = z.object({
  collateralToken: z
    .string()
    .describe("The contract address of the collateral token"),
  borrowToken: z
    .string()
    .describe("The contract address of the token to repay"),
  amount: z.string().describe("The amount of tokens to repay (in wei)"),
});

export class MemoryAwareTestnetLendingRepayTool extends MemoryAwareTool<
  typeof TestnetLendingRepayInputSchema
> {
  name = "memory_aware_testnet_lending_repay";
  description = `Repay borrowed tokens to the testnet lending pool with memory recording.
  
  This tool allows you to repay borrowed tokens to the testnet lending pool.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - collateralToken: The contract address of the collateral token
  - borrowToken: The contract address of the token to repay
  - amount: The amount of tokens to repay (in wei)`;
  schema = TestnetLendingRepayInputSchema;

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
    input: z.infer<typeof TestnetLendingRepayInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Lending repay ${input.borrowToken}`,
      2,
    );

    console.log("Relevant memories for repaying:", relevantMemories);

    // Execute the actual repay
    const txHash = await this.seiKit.repayBorrowedTokens(
      input.collateralToken as Address,
      input.borrowToken as Address,
      BigInt(input.amount),
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully repaid borrowed tokens. Transaction hash: ${txHash}`,
    };
  }

  /**
   * Override the recordToolExecution method to add lending-specific metadata
   */
  protected async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add lending-specific metadata
    const lendingMetadata = {
      ...metadata,
      collateralToken: parameters.collateralToken,
      borrowToken: parameters.borrowToken,
      amount: parameters.amount,
    };

    // Call the parent method with enhanced metadata
    await super.recordToolExecution(
      action,
      parameters,
      result,
      lendingMetadata,
    );
  }
}
