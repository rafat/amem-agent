import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { z } from "zod";
import { MemoryManager } from "../manager";

const MarketObservationInputSchema = z.object({
  token: z
    .string()
    .describe("The contract address of the token being observed"),
  price: z.number().describe("The current price of the token"),
  trend: z
    .enum(["up", "down", "stable"])
    .describe("The current price trend of the token"),
});

export class MemoryAwareMarketObservationTool extends MemoryAwareTool<
  typeof MarketObservationInputSchema
> {
  name = "memory_aware_market_observation";
  description = `Record a market observation for a token with memory recording.
  
  This tool allows you to record market observations for tokens.
  All observations are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - token: The contract address of the token being observed
  - price: The current price of the token
  - trend: The current price trend of the token (up, down, or stable)`;
  schema = MarketObservationInputSchema;

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
    input: z.infer<typeof MarketObservationInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Market observation for token ${input.token}`,
      3,
    );

    console.log("Relevant memories for market observation:", relevantMemories);

    // Record the market observation
    return {
      status: "success",
      message: `Successfully recorded market observation for token ${input.token}.`,
    };
  }

  /**
   * Override the recordToolExecution method to properly record market observations
   */
  protected async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add market observation-specific metadata
    const observationMetadata = {
      ...metadata,
      token: parameters.token,
      price: parameters.price,
      trend: parameters.trend,
      type: "market_observation",
    };

    // Call the parent method with enhanced metadata
    await super.recordToolExecution(
      action,
      parameters,
      result,
      observationMetadata,
    );
  }
}
