import { MemoryManager } from "../manager";
import { MemoryAwareTestnetAMMSwapTool } from "./index";
import { SeiAgentKit } from "../../agent";

async function debugMemoryAwareTool() {
  // Initialize memory manager
  const memoryManager = await MemoryManager.create();

  // For testing purposes, we'll create a mock SeiAgentKit
  const mockSeiKit = {
    swapTokens: async () =>
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  } as unknown as SeiAgentKit;

  const userId = "test-user-123";

  // Test AMM swap tool with debugging
  const swapTool = new MemoryAwareTestnetAMMSwapTool(
    mockSeiKit,
    memoryManager,
    userId,
  );

  try {
    console.log("Testing swap tool...");
    const result = await swapTool._call({
      tokenIn: "0xF35e93EaeE4c6dCfA24eb0BD6aE1164c8a0ffB64",
      tokenOut: "0xFF3260a3aab725b4BbBf9A94A57A5718196E5a73",
      amountIn: "1000000000000000000",
    });
    console.log("Swap tool result:", result);
  } catch (error) {
    console.error("Error with swap tool:", error);
  }

  // Close memory manager
  await memoryManager.close();
}

// Run the test
debugMemoryAwareTool().catch(console.error);
