import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetLendingWithdrawCollateralInputSchema = z.object({
  collateralToken: z
    .string()
    .describe("The contract address of the collateral token"),
  amount: z.string().describe("The amount of collateral to withdraw (in wei)"),
});

export class MemoryAwareTestnetLendingWithdrawCollateralTool extends MemoryAwareTool<
  typeof TestnetLendingWithdrawCollateralInputSchema
> {
  name = "memory_aware_testnet_lending_withdraw_collateral";
  description = `Withdraw collateral from the testnet lending pool with memory recording.
  
  This tool allows you to withdraw collateral from the testnet lending pool.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - collateralToken: The contract address of the collateral token
  - amount: The amount of collateral to withdraw (in wei)`;
  schema = TestnetLendingWithdrawCollateralInputSchema;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(
    input: z.input<typeof TestnetLendingWithdrawCollateralInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Lending withdraw collateral ${input.collateralToken}`,
      2,
    );

    console.log(
      "Relevant memories for withdrawing collateral:",
      relevantMemories,
    );

    // Execute the actual withdraw collateral
    const txHash = await this.seiKit.withdrawCollateral(
      input.collateralToken as Address,
      BigInt(input.amount),
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully withdrew collateral. Transaction hash: ${txHash}`,
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
