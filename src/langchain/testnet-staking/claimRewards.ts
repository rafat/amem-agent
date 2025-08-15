import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetStakingClaimRewardsInputSchema = z.object({
  stakingToken: z.string().describe("The contract address of the staking token"),
});

export class TestnetStakingClaimRewardsTool extends StructuredTool<typeof TestnetStakingClaimRewardsInputSchema> {
  name = "testnet_staking_claim_rewards";
  description = `Claim rewards from the testnet staking contract.

  This tool allows you to claim rewards from the testnet staking contract.

  Parameters:
  - stakingToken: The contract address of the staking token`;
  schema = TestnetStakingClaimRewardsInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetStakingClaimRewardsInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.claimStakingRewards(
        input.stakingToken as Address
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully claimed rewards. Transaction hash: ${txHash}`,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}