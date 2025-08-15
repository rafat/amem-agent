import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetStakingUnstakeInputSchema = z.object({
  stakingToken: z.string().describe("The contract address of the token to unstake"),
  amount: z.string().describe("The amount of tokens to unstake (in wei)"),
});

export class TestnetStakingUnstakeTool extends StructuredTool<typeof TestnetStakingUnstakeInputSchema> {
  name = "testnet_staking_unstake";
  description = `Unstake tokens from the testnet staking contract.

  This tool allows you to unstake tokens from the testnet staking contract.

  Parameters:
  - stakingToken: The contract address of the token to unstake
  - amount: The amount of tokens to unstake (in wei)`;
  schema = TestnetStakingUnstakeInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetStakingUnstakeInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.unstakeTokens(
        input.stakingToken as Address,
        BigInt(input.amount)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully unstaked tokens. Transaction hash: ${txHash}`,
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