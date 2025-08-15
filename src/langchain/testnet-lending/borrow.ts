import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetLendingBorrowInputSchema = z.object({
  collateralToken: z.string().describe("The contract address of the collateral token"),
  borrowToken: z.string().describe("The contract address of the token to borrow"),
  amount: z.string().describe("The amount of tokens to borrow (in wei)"),
});

export class TestnetLendingBorrowTool extends StructuredTool<typeof TestnetLendingBorrowInputSchema> {
  name = "testnet_lending_borrow";
  description = `Borrow tokens from the testnet lending pool.

  This tool allows you to borrow tokens from the testnet lending pool using collateral.

  Parameters:
  - collateralToken: The contract address of the collateral token
  - borrowToken: The contract address of the token to borrow
  - amount: The amount of tokens to borrow (in wei)`;
  schema = TestnetLendingBorrowInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetLendingBorrowInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.borrowTokens(
        input.collateralToken as Address,
        input.borrowToken as Address,
        BigInt(input.amount)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully borrowed tokens. Transaction hash: ${txHash}`,
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