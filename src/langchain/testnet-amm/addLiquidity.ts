import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetAMMAddLiquidityInputSchema = z.object({
  tokenA: z.string().describe("The contract address of the first token"),
  tokenB: z.string().describe("The contract address of the second token"),
  amountA: z.string().describe("The amount of tokenA to add (in wei)"),
  amountB: z.string().describe("The amount of tokenB to add (in wei)"),
});

export class TestnetAMMAddLiquidityTool extends StructuredTool<typeof TestnetAMMAddLiquidityInputSchema> {
  name = "testnet_amm_add_liquidity";
  description = `Add liquidity to a token pair in the testnet AMM.

  This tool allows you to add liquidity to a token pair in the testnet AMM contract.

  Parameters:
  - tokenA: The contract address of the first token
  - tokenB: The contract address of the second token
  - amountA: The amount of tokenA to add (in wei)
  - amountB: The amount of tokenB to add (in wei)`;
  schema = TestnetAMMAddLiquidityInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetAMMAddLiquidityInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.addAMMLiquidity(
        input.tokenA as Address,
        input.tokenB as Address,
        BigInt(input.amountA),
        BigInt(input.amountB)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully added liquidity. Transaction hash: ${txHash}`,
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