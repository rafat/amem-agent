import { StructuredTool } from "langchain/tools";
import { MemoryManager } from "../manager";
import { MemoryType } from "../models";
import { z } from "zod";

export abstract class MemoryAwareTool<T extends z.ZodObject<any, any, any, any>> extends StructuredTool<T> {
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
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Determine memory type based on result
      const memoryType: MemoryType = result?.status === "error" 
        ? "reflection" 
        : "transaction_record";

      // Calculate importance based on various factors
      const importance = this.calculateImportance(result, metadata);

      // Create memory content
      const content = this.formatMemoryContent(action, parameters, result);

      // Create metadata
      const memoryMetadata = {
        userId: this.userId,
        toolName: this.name,
        action,
        parameters,
        result,
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
  private calculateImportance(result: any, metadata: Record<string, any>): number {
    // Base importance
    let importance = 0.5;

    // Increase importance for errors
    if (result?.status === "error") {
      importance = Math.min(1.0, importance + 0.3);
    }

    // Increase importance for successful transactions
    if (result?.status === "success" && result?.transactionHash) {
      importance = Math.min(1.0, importance + 0.2);
    }

    // Adjust based on custom importance factor if provided
    if (metadata?.importance) {
      importance = Math.min(1.0, Math.max(0.0, importance + metadata.importance));
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
    result: any
  ): string {
    if (result?.status === "error") {
      return `Failed to execute ${action} using ${this.name}. Error: ${result.message}`;
    }

    if (result?.status === "success") {
      if (result.transactionHash) {
        return `Successfully executed ${action} using ${this.name}. Transaction hash: ${result.transactionHash}`;
      }
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
  protected async getRelevantMemories(queryText: string, k: number = 3): Promise<any[]> {
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
      await this.recordToolExecution(
        this.name,
        input,
        result,
        { status: "success" }
      );
      
      return JSON.stringify(result);
    } catch (error: any) {
      // Record error
      const errorResult = {
        status: "error",
        message: error.message || "Unknown error",
        code: error.code || "UNKNOWN_ERROR",
      };
      
      await this.recordToolExecution(
        this.name,
        input,
        errorResult,
        { status: "error" }
      );
      
      return JSON.stringify(errorResult);
    }
  }
}