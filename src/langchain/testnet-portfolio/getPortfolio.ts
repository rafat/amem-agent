import { Tool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";

export class TestnetPortfolioGetTool extends Tool {
  name = "testnet_portfolio_get";
  description = `Get the user's portfolio from the testnet contracts.

  This tool retrieves the user's complete portfolio across all testnet protocols including:
  - AMM positions (liquidity pools)
  - Lending positions (deposits and borrows)
  - Staking positions (staked tokens and rewards)`;

  constructor(private readonly seiKit: SeiAgentKit) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const portfolio = await this.seiKit.getTestnetPortfolio();

      return JSON.stringify({
        status: "success",
        portfolio,
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