import { StructuredTool } from "langchain/tools";
import { SeiAgentKit } from "../../agent";
import { z } from "zod";
import { Address } from "viem";
import { MemoryManager } from "../manager";
import { wrappedSymphonySwap } from "./symphony-swap";

const SwapInputSchema = z.object({
  amount: z.string().min(1, "Amount must not be empty"),
  tokenInTicker: z.string().min(1, "Token input ticker must not be empty"),
  tokenOutTicker: z.string().min(1, "Token output ticker must not be empty"),
});

export class SeiSwapToolWithMemory extends StructuredTool<typeof SwapInputSchema> {
  name = "sei_swap";
  description = `Swap tokens using the Symphony aggregator.

  Parameters:
  - amount: The amount of tokens to swap as a string (e.g., "1.5").
  - tokenInTicker: The ticker symbol of the token to swap from (e.g., "SEI").
  - tokenOutTicker: The ticker symbol of the token to swap to (e.g., "USDC").`;
  schema = SwapInputSchema;

  constructor(
    private readonly seiKit: SeiAgentKit,
    private readonly memoryManager: MemoryManager,
    private readonly userId: string,
  ) {
    super();
  }

  protected async _call(input: z.infer<typeof SwapInputSchema>): Promise<string> {
    try {
      const tokenInAddress = input.tokenInTicker === "SEI" ? "0x0" as Address : await this.seiKit.getTokenAddressFromTicker(input.tokenInTicker) as Address;
      const tokenOutAddress = input.tokenOutTicker === "SEI" ? "0x0" as Address : await this.seiKit.getTokenAddressFromTicker(input.tokenOutTicker) as Address;
      
      const result = await wrappedSymphonySwap(
        this.seiKit,
        input.amount,
        tokenInAddress,
        tokenOutAddress,
        this.memoryManager,
        this.userId,
      );

      return JSON.stringify({
        status: "success",
        result,
        fromToken: input.tokenInTicker,
        toToken: input.tokenOutTicker,
        amount: input.amount,
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