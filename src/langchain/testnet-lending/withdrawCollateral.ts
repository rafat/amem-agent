import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetLendingWithdrawCollateralInputSchema = z.object({
  collateralToken: z.string().describe("The contract address of the collateral token"),
  amount: z.string().describe("The amount of collateral to withdraw (in wei)"),
});

export class TestnetLendingWithdrawCollateralTool extends StructuredTool<typeof TestnetLendingWithdrawCollateralInputSchema> {
  name = "testnet_lending_withdraw_collateral";
  description = `Withdraw collateral from the testnet lending pool.

  This tool allows you to withdraw collateral tokens from the testnet lending pool.

  Parameters:
  - collateralToken: The contract address of the collateral token
  - amount: The amount of collateral to withdraw (in wei)`;
  schema = TestnetLendingWithdrawCollateralInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetLendingWithdrawCollateralInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.withdrawCollateral(
        input.collateralToken as Address,
        BigInt(input.amount)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully withdrew collateral. Transaction hash: ${txHash}`,
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