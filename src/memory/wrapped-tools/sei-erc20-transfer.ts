import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";
import { MemoryManager } from "../manager";

const SeiERC20TransferInputSchema = z.object({
  amount: z.string().min(1, "Amount must not be empty").describe("The amount of tokens to transfer as a string (e.g., \"1.5\")"),
  recipient: z.string().describe("The recipient's wallet address"),
  ticker: z.string().optional().describe("The token symbol/ticker (e.g., \"USDC\"). Do not specify for native SEI token transfers"),
});

export class MemoryAwareSeiERC20TransferTool extends MemoryAwareTool<typeof SeiERC20TransferInputSchema> {
  name = "memory_aware_sei_erc20_transfer";
  description = `Transfer tokens to another Sei wallet with memory recording.

  This tool allows you to transfer tokens to another wallet and automatically records the action in memory.
  All actions are automatically recorded in the agent's memory for future reference.

  Parameters:
  - amount: The amount of tokens to transfer as a string (e.g., "1.5") (required).
  - recipient: The recipient's wallet address (required).
  - ticker: Optional. The token symbol/ticker (e.g., "USDC"). Do not specify for native SEI token transfers.`;
  schema = SeiERC20TransferInputSchema;

  constructor(seiKit: SeiAgentKit, memoryManager: MemoryManager, userId: string) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(input: z.input<typeof SeiERC20TransferInputSchema>): Promise<any> {
    try {
      const transfer = await this.seiKit.ERC20Transfer(input.amount, input.recipient as Address, input.ticker);
      
      if (!transfer) {
        throw new Error("Transfer failed");
      }

      const result = {
        status: "success",
        transfer,
        token: input?.ticker ?? "SEI",
      };

      // Record the tool execution in memory
      await this.recordToolExecution(
        `Transferred ${input.amount} ${result.token} to ${input.recipient}`,
        {
          tool: this.name,
          input,
          output: result,
        },
        0.9, // High importance
      );

      return result;
    } catch (error: any) {
      const errorResult = {
        status: "error",
        message: error.message,
        code: error?.code ?? "UNKNOWN_ERROR",
      };

      // Record the tool execution in memory even for errors
      await this.recordToolExecution(
        `Failed to transfer ${input.amount} ${input?.ticker ?? "SEI"} to ${input.recipient}`,
        {
          tool: this.name,
          input,
          output: errorResult,
        },
        0.8, // High importance for errors
      );

      return errorResult;
    }
  }
}