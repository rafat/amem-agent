import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetLendingBorrowInputSchema = z.object({
  collateralToken: z
    .string()
    .describe("The contract address of the collateral token"),
  borrowToken: z
    .string()
    .describe("The contract address of the token to borrow"),
  amount: z.string().describe("The amount of tokens to borrow (in wei)"),
});

export class MemoryAwareTestnetLendingBorrowTool extends MemoryAwareTool<
  typeof TestnetLendingBorrowInputSchema
> {
  name = "memory_aware_testnet_lending_borrow";
  description = `Borrow tokens from the testnet lending pool with memory recording.
  
  This tool allows you to borrow tokens from the testnet lending pool.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - collateralToken: The contract address of the collateral token
  - borrowToken: The contract address of the token to borrow
  - amount: The amount of tokens to borrow (in wei)`;
  schema = TestnetLendingBorrowInputSchema;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(
    input: z.input<typeof TestnetLendingBorrowInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Lending borrow ${input.borrowToken}`,
      2,
    );

    console.log("Relevant memories for borrowing:", relevantMemories);

    // Execute the actual borrow
    const txHash = await this.seiKit.borrowTokens(
      input.collateralToken as Address,
      input.borrowToken as Address,
      BigInt(input.amount),
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully borrowed tokens. Transaction hash: ${txHash}`,
    };
  }

  /**
   * Override the recordToolExecution method to add lending-specific metadata
   */
  protected override async recordToolExecution(
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
