import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";
import { MemoryManager } from "../manager";
import { approveToken } from "../../utils/approveTokens";

const SeiERC20ApproveInputSchema = z.object({
  tokenAddress: z.string().describe("The contract address of the token to approve"),
  spender: z.string().describe("The address of the spender (e.g., AMM contract address)"),
  amount: z.string().describe("The amount of tokens to approve (in wei)"),
});

export class MemoryAwareSeiERC20ApproveTool extends MemoryAwareTool<typeof SeiERC20ApproveInputSchema> {
  name = "memory_aware_sei_erc20_approve";
  description = `Approve a spender to use tokens from your wallet with memory recording.

  This tool allows you to approve a spender (like an AMM contract) to use tokens from your wallet.
  This is typically required before swapping tokens or adding liquidity.
  All actions are automatically recorded in the agent's memory for future reference.

  Parameters:
  - tokenAddress: The contract address of the token to approve
  - spender: The address of the spender (e.g., AMM contract address)
  - amount: The amount of tokens to approve (in wei)`;
  schema = SeiERC20ApproveInputSchema;

  constructor(seiKit: SeiAgentKit, memoryManager: MemoryManager, userId: string) {
    super(memoryManager, userId, seiKit);
  }

  protected override async _callRaw(input: z.input<typeof SeiERC20ApproveInputSchema>): Promise<any> {
    try {
      await approveToken(
        this.seiKit,
        input.tokenAddress as Address,
        input.spender as Address,
        BigInt(input.amount)
      );

      const result = {
        status: "success",
        message: `Successfully approved ${input.amount} tokens for spender ${input.spender}`,
      };

      // Record the tool execution in memory
      await this.recordToolExecution(
        `Approved ${input.amount} tokens for spender ${input.spender}`,
        {
          tool: this.name,
          input,
          output: result,
        },
        0.8, // High importance
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
        `Failed to approve tokens for spender ${input.spender}`,
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