import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const TestnetAMMRemoveLiquidityInputSchema = z.object({
  tokenA: z.string().describe("The contract address of the first token"),
  tokenB: z.string().describe("The contract address of the second token"),
  liquidity: z.string().describe("The amount of liquidity to remove (in wei)"),
});

export class TestnetAMMRemoveLiquidityTool extends StructuredTool<typeof TestnetAMMRemoveLiquidityInputSchema> {
  name = "testnet_amm_remove_liquidity";
  description = `Remove liquidity from a token pair in the testnet AMM.

  This tool allows you to remove liquidity from a token pair in the testnet AMM contract.

  Parameters:
  - tokenA: The contract address of the first token
  - tokenB: The contract address of the second token
  - liquidity: The amount of liquidity to remove (in wei)`;
  schema = TestnetAMMRemoveLiquidityInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof TestnetAMMRemoveLiquidityInputSchema>): Promise<string> {
    try {
      const txHash = await this.seiKit.removeLiquidity(
        input.tokenA as Address,
        input.tokenB as Address,
        BigInt(input.liquidity)
      );

      return JSON.stringify({
        status: "success",
        transactionHash: txHash,
        message: `Successfully removed liquidity. Transaction hash: ${txHash}`,
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