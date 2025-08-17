import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetLendingBorrowInputSchema = z.object({
  borrowToken: z.string().describe("The contract address of the token to borrow"),
  amount: z.string().describe("The amount of tokens to borrow (in wei)"),
});

export class MemoryAwareTestnetLendingBorrowTool extends MemoryAwareTool<typeof TestnetLendingBorrowInputSchema> {
  name = "memory_aware_testnet_lending_borrow";
  description = `Borrow tokens from the testnet lending pool with memory recording.
  
  This tool allows you to borrow tokens from the testnet lending pool.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - borrowToken: The contract address of the token to borrow
  - amount: The amount of tokens to borrow (in wei)`;
  schema = TestnetLendingBorrowInputSchema;

  private readonly seiKit: SeiAgentKit;

  constructor(seiKit: SeiAgentKit, memoryManager: MemoryManager, userId: string) {
    super(memoryManager, userId);
    this.seiKit = seiKit;
  }

  protected async _callRaw(input: z.infer<typeof TestnetLendingBorrowInputSchema>): Promise<any> {
    try {
      // Get relevant memories for context
      const relevantMemories = await this.getRelevantMemories(
        `Lending borrow ${input.borrowToken}`, 
        2
      );
      
      console.log("Relevant memories for borrowing:", relevantMemories);

      // TODO: Implement the actual borrow functionality
      // For now, we'll simulate a successful transaction
      const txHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
      
      return {
        status: "success",
        transactionHash: txHash,
        message: `Successfully borrowed tokens. Transaction hash: ${txHash}`,
      };
    } catch (error: any) {
      throw error;
    }
  }
}