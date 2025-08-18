import { StructuredTool } from "langchain/tools";
import { MemoryManager } from "../manager";
import { MemoryType } from "../models";
import { z } from "zod";

export abstract class MemoryAwareTool<
  T extends z.ZodObject<any, any, any, any>,
> extends StructuredTool<T> {
  protected memoryManager: MemoryManager;
  protected userId: string;

  constructor(memoryManager: MemoryManager, userId: string) {
    super();
    this.memoryManager = memoryManager;
    this.userId = userId;
  }

  /**
   * Record a tool execution in the memory system
   * @param action The action that was performed
   * @param parameters The parameters used
   * @param result The result of the action
   * @param metadata Additional metadata
   */
  protected async recordToolExecution(
    action: string,
    parameters: Record<string, any>,
    result: any,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      // Determine memory type based on result and action
      let memoryType: MemoryType = "transaction_record";
      if (result?.status === "error") {
        memoryType = "reflection";
      } else if (action.includes("strategy") || action.includes("analyze")) {
        memoryType = "strategy_outcome";
      } else if (action.includes("observe") || action.includes("price")) {
        memoryType = "market_observation";
      }

      // Calculate importance based on various factors
      const importance = this.calculateImportance(result, metadata);

      // Create memory content
      const content = this.formatMemoryContent(action, parameters, result);

      // Determine protocol based on tool name
      let protocol = "Unknown";
      if (this.name.includes("amm")) {
        protocol = "AMM";
      } else if (this.name.includes("lending")) {
        protocol = "Lending";
      } else if (this.name.includes("staking")) {
        protocol = "Staking";
      } else if (this.name.includes("portfolio")) {
        protocol = "Portfolio";
      }

      // Create enhanced metadata
      const memoryMetadata = {
        userId: this.userId,
        toolName: this.name,
        action,
        parameters,
        result,
        protocol,
        ...metadata,
        timestamp: new Date().toISOString(),
      };

      // Store in memory system
      await this.memoryManager.addMemory({
        content,
        type: memoryType,
        importance,
        metadata: memoryMetadata,
      });

      console.log(`Recorded memory for tool execution: ${action}`);
    } catch (error) {
      console.error("Failed to record tool execution in memory:", error);
    }
  }

  /**
   * Calculate importance score for a memory
   * @param result The result of the tool execution
   * @param metadata Additional metadata
   * @returns Importance score between 0.0 and 1.0
   */
  private calculateImportance(
    result: any,
    metadata: Record<string, any>,
  ): number {
    // Base importance
    let importance = 0.3; // Lower base importance

    // Increase importance for errors
    if (result?.status === "error") {
      importance = Math.min(1.0, importance + 0.4);
    }

    // Increase importance for successful transactions
    if (result?.status === "success" && result?.transactionHash) {
      importance = Math.min(1.0, importance + 0.3);
    }

    // Increase importance for strategy outcomes
    if (result?.status === "success" && metadata?.type === "strategy_outcome") {
      importance = Math.min(1.0, importance + 0.3);
    }

    // Increase importance for market observations
    if (
      result?.status === "success" &&
      metadata?.type === "market_observation"
    ) {
      importance = Math.min(1.0, importance + 0.2);
    }

    // Adjust importance based on transaction value for financial transactions
    if (metadata?.amount && result?.status === "success") {
      try {
        // Convert amount to a number for comparison
        const amount = parseFloat(metadata.amount.toString());
        if (amount > 1000000000000000000n) {
          // 1 token (assuming 18 decimals)
          importance = Math.min(1.0, importance + 0.2);
        } else if (amount > 100000000000000000n) {
          // 0.1 token
          importance = Math.min(1.0, importance + 0.1);
        }
      } catch (_error) {
        // Ignore parsing errors
      }
    }

    // Adjust based on custom importance factor if provided
    if (metadata?.importance) {
      importance = Math.min(
        1.0,
        Math.max(0.0, importance + metadata.importance),
      );
    }

    return importance;
  }

  /**
   * Format memory content for storage
   * @param action The action that was performed
   * @param parameters The parameters used
   * @param result The result of the action
   * @returns Formatted content string
   */
  private formatMemoryContent(
    action: string,
    parameters: Record<string, any>,
    result: any,
  ): string {
    if (result?.status === "error") {
      return `Failed to execute ${action} using ${this.name}. Error: ${result.message}`;
    }

    if (result?.status === "success") {
      // For transactions with hash
      if (result.transactionHash) {
        // Format content based on the tool type
        if (this.name.includes("swap")) {
          return `Successfully swapped ${parameters.amountIn} of token ${parameters.tokenIn} for token ${parameters.tokenOut}. Transaction hash: ${result.transactionHash}`;
        } else if (this.name.includes("liquidity")) {
          if (this.name.includes("add")) {
            return `Successfully added liquidity of ${parameters.amountADesired} token ${parameters.tokenA} and ${parameters.amountBDesired} token ${parameters.tokenB}. Transaction hash: ${result.transactionHash}`;
          } else {
            return `Successfully removed liquidity of token ${parameters.tokenA} and ${parameters.tokenB}. Transaction hash: ${result.transactionHash}`;
          }
        } else if (this.name.includes("lending")) {
          if (this.name.includes("deposit")) {
            return `Successfully deposited ${parameters.amount} of collateral token ${parameters.collateralToken}. Transaction hash: ${result.transactionHash}`;
          } else if (this.name.includes("borrow")) {
            return `Successfully borrowed ${parameters.amount} of token ${parameters.borrowToken} using collateral token ${parameters.collateralToken}. Transaction hash: ${result.transactionHash}`;
          } else if (this.name.includes("repay")) {
            return `Successfully repaid ${parameters.amount} of borrowed token ${parameters.borrowToken}. Transaction hash: ${result.transactionHash}`;
          } else if (this.name.includes("withdraw")) {
            return `Successfully withdrew ${parameters.amount} of collateral token ${parameters.collateralToken}. Transaction hash: ${result.transactionHash}`;
          }
        } else if (this.name.includes("staking")) {
          if (this.name.includes("stake")) {
            return `Successfully staked ${parameters.amount} of token ${parameters.stakingToken}. Transaction hash: ${result.transactionHash}`;
          } else if (this.name.includes("unstake")) {
            return `Successfully unstaked ${parameters.amount} of token ${parameters.stakingToken}. Transaction hash: ${result.transactionHash}`;
          } else if (this.name.includes("claim")) {
            return `Successfully claimed rewards for staking token ${parameters.stakingToken}. Transaction hash: ${result.transactionHash}`;
          }
        } else if (this.name.includes("portfolio")) {
          return `Successfully retrieved portfolio information. Transaction hash: ${result.transactionHash}`;
        }

        // Default format for other transactions
        return `Successfully executed ${action} using ${this.name}. Transaction hash: ${result.transactionHash}`;
      }

      // For successful operations without transaction hash (like portfolio retrieval)
      if (this.name.includes("portfolio") && result.portfolio) {
        return `Retrieved portfolio information with ${result.portfolio.ammPositions?.length || 0} AMM positions, ${result.portfolio.lendingPositions?.length || 0} lending positions, and ${result.portfolio.stakingPositions?.length || 0} staking positions.`;
      }

      // Generic success message
      return `Successfully executed ${action} using ${this.name}. Result: ${JSON.stringify(result)}`;
    }

    return `Executed ${action} using ${this.name}. Result: ${JSON.stringify(result)}`;
  }

  /**
   * Retrieve relevant memories for context
   * @param queryText Text to search for relevant memories
   * @param k Number of memories to retrieve
   * @returns Array of relevant memories
   */
  protected async getRelevantMemories(
    queryText: string,
    k: number = 3,
  ): Promise<any[]> {
    try {
      return await this.memoryManager.retrieveMemories(queryText, k);
    } catch (error) {
      console.error("Failed to retrieve relevant memories:", error);
      return [];
    }
  }

  /**
   * Abstract method that must be implemented by subclasses
   * This is where the actual tool logic goes
   */
  protected abstract _callRaw(input: z.infer<T>): Promise<any>;

  /**
   * Wrapper around _callRaw that adds memory recording
   */
  protected async _call(input: z.infer<T>): Promise<string> {
    try {
      const result = await this._callRaw(input);

      // Record successful execution
      await this.recordToolExecution(this.name, input, result, {
        status: "success",
      });

      return JSON.stringify(result);
    } catch (error: any) {
      // Record error
      const errorResult = {
        status: "error",
        message: error.message || "Unknown error",
        code: error.code || "UNKNOWN_ERROR",
      };

      await this.recordToolExecution(this.name, input, errorResult, {
        status: "error",
      });

      return JSON.stringify(errorResult);
    }
  }
}
