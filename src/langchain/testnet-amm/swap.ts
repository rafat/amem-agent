import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetAMMSwapInputSchema = z.object({
  tokenIn: z.string().describe("The contract address of the input token to swap from"),
  tokenOut: z.string().describe("The contract address of the output token to swap to"),
  amountIn: z.string().describe("The amount of input tokens to swap (in wei)"),
});

export class TestnetAMMSwapTool extends StructuredTool<typeof TestnetAMMSwapInputSchema> {
  name = "testnet_amm_swap";
  description = `Swap tokens using the testnet AMM.

  This tool allows you to swap one token for another using the testnet AMM contract.

  Parameters:
  - tokenIn: The contract address of the input token to swap from
  - tokenOut: The contract address of the output token to swap to
  - amountIn: The amount of input tokens to swap (in wei)`;
  schema = TestnetAMMSwapInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetAMMSwapInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.swapTokens(
        input.tokenIn as Address,
        input.tokenOut as Address,
        BigInt(input.amountIn)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully swapped tokens. Transaction hash: ${txHash}`,
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