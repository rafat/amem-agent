import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import { Memory } from "../../src/memory/models";
import { ModelProviderName } from "../../src/types";
import * as dotenv from "dotenv";

dotenv.config();

describe("Agent Memory Capabilities", () => {
  let agent: SeiAgentKit;
  let memoryManager: MemoryManager;

  beforeAll(async () => {
    // Create memory manager
    memoryManager = await MemoryManager.create();
    
    // Create agent with real private key
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should retrieve relevant memories", async () => {
    // Add a test memory
    await memoryManager.addMemory({
      content: "Successfully swapped WETH for USDC on AMM",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC"
      }
    });

    const memories = await agent.getRelevantMemories("swap tokens", 5);
    expect(memories.length).toBeGreaterThan(0);
    
    const relevantMemory = memories.find(mem => mem.content.includes("swapped WETH for USDC"));
    expect(relevantMemory).toBeDefined();
  });

  it("should score memories correctly", async () => {
    const testMemory: Memory = {
      id: "test-memory-123",
      content: "Successfully swapped tokens with high profit",
      type: "transaction_record",
      timestamp: new Date(),
      importance: 0.9,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC"
      }
    };

    const score = await agent.calculateRelevanceScore("swap WETH to USDC", testMemory);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("should create memory-aware prompts", async () => {
    // Add a test memory
    await memoryManager.addMemory({
      content: "Previous successful token swap with 2% profit",
      type: "transaction_record",
      importance: 0.7,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        profit: "0.02"
      }
    });

    const basePrompt = "You are an AI assistant helping with DeFi operations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap tokens", 300);
    
    expect(enhancedPrompt.length).toBeGreaterThan(basePrompt.length);
    expect(enhancedPrompt).toContain("Past Experiences");
    expect(enhancedPrompt).toContain("Previous successful token swap");
  });

  it("should retrieve scored memories", async () => {
    // Add test memories
    await memoryManager.addMemory({
      content: "Highly relevant memory about token swapping",
      type: "transaction_record",
      importance: 0.9,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM"
      }
    });

    const scoredMemories = await agent.getScoredMemories("swap tokens", 5);
    expect(scoredMemories.length).toBeGreaterThan(0);
    
    // Check that all items have scores
    scoredMemories.forEach(item => {
      expect(item.score).toBeDefined();
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(1);
      expect(item.memory).toBeDefined();
    });
  });
});