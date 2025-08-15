import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetStakingStakeInputSchema = z.object({
  stakingToken: z.string().describe("The contract address of the token to stake"),
  amount: z.string().describe("The amount of tokens to stake (in wei)"),
});

export class TestnetStakingStakeTool extends StructuredTool<typeof TestnetStakingStakeInputSchema> {
  name = "testnet_staking_stake";
  description = `Stake tokens in the testnet staking contract.

  This tool allows you to stake tokens in the testnet staking contract.

  Parameters:
  - stakingToken: The contract address of the token to stake
  - amount: The amount of tokens to stake (in wei)`;
  schema = TestnetStakingStakeInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetStakingStakeInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.stakeTokens(
        input.stakingToken as Address,
        BigInt(input.amount)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully staked tokens. Transaction hash: ${txHash}`,
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