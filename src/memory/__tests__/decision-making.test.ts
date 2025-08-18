import { SeiAgentKit } from "../../agent";
import { MemoryManager } from "../manager";
import { Memory } from "../models";
import { ModelProviderName } from "../../types";

describe("Memory-Based Decision Making", () => {
  let agent: SeiAgentKit;
  let memoryManager: MemoryManager;

  beforeAll(async () => {
    // Create memory manager
    memoryManager = await MemoryManager.create();
    
    // Create mock agent
    const mockPrivateKey = "0x0123456789012345678901234567890123456789012345678901234567890123";
    
    // Create agent with memory manager
    agent = new SeiAgentKit(
      mockPrivateKey,
      ModelProviderName.OPENAI,
      memoryManager
    );
  });

  afterAll(async () => {
    // Close memory manager
    await memoryManager.close();
  });

  beforeEach(async () => {
    // Clear any existing memories for clean tests
    // Note: In a real implementation, you might want to reset the database
  });

  it("should retrieve relevant memories with scores", async () => {
    // Add a test memory
    await memoryManager.addMemory({
      content: "Successfully swapped tokens on AMM",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "USDC",
        toToken: "WETH"
      }
    });

    // Retrieve scored memories
    const scoredMemories = await agent.getScoredMemories("swap tokens", 5);
    
    expect(scoredMemories).toHaveLength(1);
    expect(scoredMemories[0].score).toBeGreaterThan(0);
    expect(scoredMemories[0].memory.content).toContain("swapped tokens");
  });

  it("should calculate temporal weighting correctly", async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000); // 1 day ago
    const oneWeekAgo = new Date(now.getTime() - 604800000); // 1 week ago
    
    // Test temporal weighting
    const recentWeight = memoryManager.calculateTemporalWeight(oneDayAgo);
    const olderWeight = memoryManager.calculateTemporalWeight(oneWeekAgo);
    
    // More recent memories should have higher weights
    expect(recentWeight).toBeGreaterThan(olderWeight);
    
    // Both should be between 0 and 1
    expect(recentWeight).toBeGreaterThanOrEqual(0);
    expect(recentWeight).toBeLessThanOrEqual(1);
    expect(olderWeight).toBeGreaterThanOrEqual(0);
    expect(olderWeight).toBeLessThanOrEqual(1);
  });

  it("should create memory-aware prompts with context compression", async () => {
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

    const basePrompt = "You are an AI assistant helping with DeFi operations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap tokens", 200);
    
    expect(enhancedPrompt).toContain("You are an AI assistant");
    expect(enhancedPrompt).toContain("Past Experiences");
    expect(enhancedPrompt).toContain("Highly relevant memory");
  });

  it("should calculate relevance scores correctly", async () => {
    const testMemory: Memory = {
      id: "test-memory-123",
      content: "Successfully swapped WETH for USDC on AMM",
      type: "transaction_record",
      timestamp: new Date(),
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC"
      }
    };
    
    const relevanceScore = await agent.calculateRelevanceScore("swap WETH to USDC", testMemory);
    
    // Should be a valid score between 0 and 1
    expect(relevanceScore).toBeGreaterThanOrEqual(0);
    expect(relevanceScore).toBeLessThanOrEqual(1);
    
    // Should be relatively high for a very relevant memory
    expect(relevanceScore).toBeGreaterThan(0.5);
  });
});