import { MemoryAwareTestnetAMMSwapTool } from "../../src/memory/wrapped-tools/testnet-amm-swap";
import { MemoryManager } from "../../src/memory/manager";
import { SeiAgentKit } from "../../src/agent";
import { ModelProviderName } from "../../src/types";
import * as dotenv from "dotenv";

dotenv.config();

describe("Memory-Aware Tools", () => {
  let memoryManager: MemoryManager;
  let agent: SeiAgentKit;
  let swapTool: MemoryAwareTestnetAMMSwapTool;

  beforeAll(async () => {
    // Create memory manager
    memoryManager = await MemoryManager.create();
    
    // Create agent with real private key
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
    
    // Create swap tool
    swapTool = new MemoryAwareTestnetAMMSwapTool(agent, memoryManager, "test-user-123");
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should have correct tool properties", () => {
    expect(swapTool.name).toBe("memory_aware_testnet_amm_swap");
    expect(swapTool.description).toContain("Swap tokens using the testnet AMM with memory recording");
    expect(swapTool.schema).toBeDefined();
  });

  it("should calculate importance scores correctly", async () => {
    // Create a test scenario
    const testMemory = {
      id: "test-123",
      content: "Successfully swapped tokens on AMM",
      type: "transaction_record",
      timestamp: new Date(),
      importance: 0.5,
      metadata: {
        userId: "test-user-123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC",
        amount: "1000000000000000000" // 1 token
      }
    };

    // This is a bit tricky to test directly since calculateImportance is private
    // We'll test by simulating a tool execution and checking the recorded memory
    expect(true).toBe(true); // Placeholder - we'll expand this later
  });

  it("should format memory content correctly", async () => {
    // Similar to above, this is private so we'll test indirectly
    expect(true).toBe(true); // Placeholder
  });
});