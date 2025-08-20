import { Tool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';

export class SeiERC20BalanceTool extends Tool {
  name = "sei_erc20_balance";
  description = `Get the balance of ERC20 tokens in a Sei wallet. 
  Use contract_address to specify a token contract address.
  Use ticker to specify a token symbol (e.g., "USDC").
  If neither is provided, returns the native SEI token balance.`;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(arg: string): Promise<string> {
    try {
      // Parse the input
      let input: { contract_address?: string; ticker?: string } = {};
      if (arg.trim()) {
        try {
          input = JSON.parse(arg);
        } catch (e) {
          // If it's not valid JSON, treat it as a ticker
          input = { ticker: arg.trim() };
        }
      }

      let balance;
      if (input.ticker) {
        const contract_address = await this.seiKit.getTokenAddressFromTicker(input.ticker);
        balance = await this.seiKit.getERC20Balance(contract_address);
      } else if (input.contract_address) {
        balance = await this.seiKit.getERC20Balance(input.contract_address as Address);
      } else {
        balance = await this.seiKit.getERC20Balance();
      }

      return JSON.stringify({
        status: "success",
        balance,
        token: input.ticker || input.contract_address || "SEI",
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