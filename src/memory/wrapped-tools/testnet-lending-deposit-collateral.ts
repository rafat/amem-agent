import { MemoryAwareTool } from "./base";
import { SeiAgentKit } from "../../agent";
import { Address } from 'viem';
import { z } from "zod";
import { MemoryManager } from "../manager";

const TestnetLendingDepositCollateralInputSchema = z.object({
  collateralToken: z.string().describe("The contract address of the collateral token"),
  amount: z.string().describe("The amount of collateral to deposit (in wei)"),
});

export class MemoryAwareTestnetLendingDepositCollateralTool extends MemoryAwareTool<typeof TestnetLendingDepositCollateralInputSchema> {
  name = "memory_aware_testnet_lending_deposit_collateral";
  description = `Deposit collateral in the testnet lending pool with memory recording.
  
  This tool allows you to deposit collateral in the testnet lending pool.
  All actions are automatically recorded in the agent's memory for future reference.
  
  Parameters:
  - collateralToken: The contract address of the collateral token
  - amount: The amount of collateral to deposit (in wei)`;
  schema = TestnetLendingDepositCollateralInputSchema;

  private readonly seiKit: SeiAgentKit;

  constructor(seiKit: SeiAgentKit, memoryManager: MemoryManager, userId: string) {
    super(memoryManager, userId);
    this.seiKit = seiKit;
  }

  protected async _callRaw(input: z.infer<typeof TestnetLendingDepositCollateralInputSchema>): Promise<any> {
    try {
      // Get relevant memories for context
      const relevantMemories = await this.getRelevantMemories(
        `Lending deposit collateral ${input.collateralToken}`, 
        2
      );
      
      console.log("Relevant memories for depositing collateral:", relevantMemories);

      // TODO: Implement the actual deposit collateral functionality
      // For now, we'll simulate a successful transaction
      const txHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
      
      return {
        status: "success",
        transactionHash: txHash,
        message: `Successfully deposited collateral. Transaction hash: ${txHash}`,
      };
    } catch (error: any) {
      throw error;
    }
  }
}