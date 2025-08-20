import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { z } from "zod";
import { MemoryManager } from "../manager";

const StrategyOutcomeInputSchema = z.object({
  strategy: z.string().describe("The name of the strategy that was executed"),
  outcome: z.string().describe("A description of the outcome of the strategy"),
  profitability: z
    .number()
    .min(-1)
    .max(1)
    .describe(
      "The profitability of the strategy on a scale from -1 (completely unprofitable) to 1 (highly profitable)",
    ),
});

export class MemoryAwareStrategyOutcomeTool extends MemoryAwareTool<
  typeof StrategyOutcomeInputSchema
> {
  name = "memory_aware_strategy_outcome";
  description = `Record the outcome of a DeFi strategy with memory recording.
  
  This tool allows you to record the outcome of a DeFi strategy execution.
  All outcomes are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - strategy: The name of the strategy that was executed
  - outcome: A description of the outcome of the strategy
  - profitability: The profitability of the strategy on a scale from -1 (completely unprofitable) to 1 (highly profitable)`;
  schema = StrategyOutcomeInputSchema;

  constructor(
    seiKit: SeiAgentKit,
    memoryManager: MemoryManager,
    userId: string,
  ) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(
    input: z.input<typeof StrategyOutcomeInputSchema>,
  ): Promise<any> {
    // Get relevant memories for context
    const relevantMemories = await this.getRelevantMemories(
      `Strategy outcome for ${input.strategy}`,
      3,
    );

    console.log("Relevant memories for strategy outcome:", relevantMemories);

    // Record the strategy outcome
    return {
      status: "success",
      message: `Successfully recorded strategy outcome for ${input.strategy}.`,
    };
  }

  /**
   * Override the recordToolExecution method to add strategy outcome-specific metadata
   */
  protected override async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    // Add strategy-specific metadata
    const strategyMetadata = {
      ...metadata,
      strategy: parameters.strategy,
      outcome: parameters.outcome,
      profitability: parameters.profitability,
      type: "strategy_outcome",
    };

    // Call the parent method with enhanced metadata
    await super.recordToolExecution(
      action,
      parameters,
      result,
      strategyMetadata,
    );
  }
}
