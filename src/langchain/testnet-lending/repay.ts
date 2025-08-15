import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetLendingRepayInputSchema = z.object({
  collateralToken: z.string().describe("The contract address of the collateral token"),
  borrowToken: z.string().describe("The contract address of the borrowed token"),
  amount: z.string().describe("The amount of tokens to repay (in wei)"),
});

export class TestnetLendingRepayTool extends StructuredTool<typeof TestnetLendingRepayInputSchema> {
  name = "testnet_lending_repay";
  description = `Repay borrowed tokens to the testnet lending pool.

  This tool allows you to repay borrowed tokens to the testnet lending pool.

  Parameters:
  - collateralToken: The contract address of the collateral token
  - borrowToken: The contract address of the borrowed token
  - amount: The amount of tokens to repay (in wei)`;
  schema = TestnetLendingRepayInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetLendingRepayInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.repayBorrowedTokens(
        input.collateralToken as Address,
        input.borrowToken as Address,
        BigInt(input.amount)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully repaid borrowed tokens. Transaction hash: ${txHash}`,
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