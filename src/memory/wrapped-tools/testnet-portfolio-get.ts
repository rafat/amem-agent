import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetPortfolioGetInputSchema = z.object({});

export class MemoryAwareTestnetPortfolioGetTool extends MemoryAwareTool<
  typeof TestnetPortfolioGetInputSchema
> {
  name = "memory_aware_testnet_portfolio_get";
  description = `Get the user's portfolio from the testnet contracts with memory recording.
  
  This tool allows you to retrieve the user's portfolio information from the testnet contracts.
  All actions are automatically recorded in the agent's memory for future reference.`;
  schema = TestnetPortfolioGetInputSchema;

  private readonly seiKit: SeiAgentKit;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId);
    this.seiKit = seiKit;
  }

  protected async _callRaw(
    _input: z.infer<typeof TestnetPortfolioGetInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Portfolio retrieval`,
      2,
    );

    console.log("Relevant memories for portfolio retrieval:", relevantMemories);

    // Execute the actual portfolio retrieval
    const portfolio = await this.seiKit.getTestnetPortfolio();

    return {
      status: "success",
      portfolio,
      message: `Successfully retrieved portfolio information.`,
    };
  }

  /**
   * Override the recordToolExecution method to add portfolio-specific metadata
   */
  protected async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add portfolio-specific metadata
    const portfolioMetadata = {
      ...metadata,
      portfolio: result.portfolio || {},
    };

    // Call the parent method with enhanced metadata
    await super.recordToolExecution(
      action,
      parameters,
      result,
      portfolioMetadata,
    );
  }
}
