import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetLendingDepositCollateralInputSchema = z.object({
  collateralToken: z.string().describe("The contract address of the collateral token"),
  amount: z.string().describe("The amount of collateral to deposit (in wei)"),
});

export class TestnetLendingDepositCollateralTool extends StructuredTool<typeof TestnetLendingDepositCollateralInputSchema> {
  name = "testnet_lending_deposit_collateral";
  description = `Deposit collateral in the testnet lending pool.

  This tool allows you to deposit collateral tokens in the testnet lending pool.

  Parameters:
  - collateralToken: The contract address of the collateral token
  - amount: The amount of collateral to deposit (in wei)`;
  schema = TestnetLendingDepositCollateralInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetLendingDepositCollateralInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.depositCollateral(
        input.collateralToken as Address,
        BigInt(input.amount)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully deposited collateral. Transaction hash: ${txHash}`,
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