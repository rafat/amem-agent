import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetStakingStakeInputSchema = z.object({
  stakingToken: z
    .string()
    .describe("The contract address of the token to stake"),
  amount: z.string().describe("The amount of tokens to stake (in wei)"),
});

export class MemoryAwareTestnetStakingStakeTool extends MemoryAwareTool<
  typeof TestnetStakingStakeInputSchema
> {
  name = "memory_aware_testnet_staking_stake";
  description = `Stake tokens in the testnet staking contract with memory recording.
  
  This tool allows you to stake tokens in the testnet staking contract.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - stakingToken: The contract address of the token to stake
  - amount: The amount of tokens to stake (in wei)`;
  schema = TestnetStakingStakeInputSchema;

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
    input: z.infer<typeof TestnetStakingStakeInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Staking stake ${input.stakingToken}`,
      2,
    );

    console.log("Relevant memories for staking:", relevantMemories);

    // Execute the actual stake
    const txHash = await this.seiKit.stakeTokens(
      input.stakingToken as Address,
      BigInt(input.amount),
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully staked tokens. Transaction hash: ${txHash}`,
    };
  }

  /**
   * Override the recordToolExecution method to add staking-specific metadata
   */
  protected async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add staking-specific metadata
    const stakingMetadata = {
      ...metadata,
      stakingToken: parameters.stakingToken,
      amount: parameters.amount,
    };

    // Call the parent method with enhanced metadata
    await super.recordToolExecution(
      action,
      parameters,
      result,
      stakingMetadata,
    );
  }
}
