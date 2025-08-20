import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from "viem";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetStakingClaimRewardsInputSchema = z.object({
  stakingToken: z
    .string()
    .describe("The contract address of the staking token"),
});

export class MemoryAwareTestnetStakingClaimRewardsTool extends MemoryAwareTool<
  typeof TestnetStakingClaimRewardsInputSchema
> {
  name = "memory_aware_testnet_staking_claim_rewards";
  description = `Claim rewards from the testnet staking contract with memory recording.
  
  This tool allows you to claim rewards from the testnet staking contract.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - stakingToken: The contract address of the staking token`;
  schema = TestnetStakingClaimRewardsInputSchema;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(
    input: z.input<typeof TestnetStakingClaimRewardsInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Staking claim rewards for ${input.stakingToken}`,
      2,
    );

    console.log("Relevant memories for claiming rewards:", relevantMemories);

    // Execute the actual claim rewards
    const txHash = await this.seiKit.claimStakingRewards(
      input.stakingToken as Address,
    );

    return {
      status: "success",
      transactionHash: txHash,
      message: `Successfully claimed staking rewards. Transaction hash: ${txHash}`,
    };
  }

  /**
   * Override the recordToolExecution method to add staking-specific metadata
   */
  protected override async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add staking-specific metadata
    const stakingMetadata = {
      ...metadata,
      stakingToken: parameters.stakingToken,
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
