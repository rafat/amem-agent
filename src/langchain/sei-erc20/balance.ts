import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";

const SeiERC20BalanceInputSchema = z.object({
  contract_address: z.string().optional().describe("The contract address of the token"),
  ticker: z.string().optional().describe("The token symbol/ticker (e.g., \"USDC\")"),
});

export class SeiERC20BalanceTool extends StructuredTool<typeof SeiERC20BalanceInputSchema> {
  name = "sei_erc20_balance";
  description = `Get the balance of ERC20 tokens in a Sei wallet.

  This tool retrieves token balances without requiring a wallet address (uses connected wallet).

  If neither parameter is provided, returns the native SEI token balance.

  Parameters:
  - contract_address: Optional. The contract address of the token.
  - ticker: Optional. The token symbol/ticker (e.g., "USDC").

  One of these parameters can be used to specify a non-SEI token.`;
  schema = SeiERC20BalanceInputSchema;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(input: z.infer<typeof SeiERC20BalanceInputSchema>): Promise<string> {
    try {
      let balance;
      if (input) {
        let contract_address;
        if (input.ticker) {
          contract_address = await this.seiKit.getTokenAddressFromTicker(input.ticker);
        }
        else if (input.contract_address) { 
          contract_address = input.contract_address as Address; 
        }
        balance = await this.seiKit.getERC20Balance(contract_address);
      } else {
        balance = await this.seiKit.getERC20Balance();
      }

      const result = {
        status: "success",
        balance,
        token: input.ticker || input.contract_address || "SEI",
      };

      return JSON.stringify(result);
    } catch (error: any) {
      const errorResult = {
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      };

      return JSON.stringify(errorResult);
    }
  }
}