import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../../src/types";

dotenv.config();

describe("Performance Benchmarks", () => {
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

  beforeEach(async () => {
    // Clear any existing memories for consistent benchmarking
    // Note: In a real implementation, you might want to reset the database
  });

  it("should measure memory storage performance", async () => {
    const startTime = Date.now();
    
    // Add 100 test memories
    for (let i = 0; i < 100; i++) {
      await memoryManager.addMemory({
        content: `Performance test memory ${i}: Successfully performed DeFi operation with ${Math.random().toFixed(2)}% profit`,
        type: "transaction_record",
        importance: Math.random(),
        metadata: {
          userId: "perf_test_user",
          protocol: ["AMM", "Lending", "Staking"][Math.floor(Math.random() * 3)],
          fromToken: ["WETH", "USDC", "DAI"][Math.floor(Math.random() * 3)],
          toToken: ["USDC", "DAI", "WETH"][Math.floor(Math.random() * 3)],
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString()
        }
      });
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerMemory = totalTime / 100;
    
    console.log(`Memory Storage Performance: ${avgTimePerMemory.toFixed(2)}ms per memory (${totalTime}ms total for 100 memories)`);
    
    // Expect average time per memory to be reasonable (less than 500ms)
    expect(avgTimePerMemory).toBeLessThan(500);
  }, 10000); // 10 second timeout

  it("should measure memory retrieval performance", async () => {
    // Pre-populate with test memories
    for (let i = 0; i < 50; i++) {
      await memoryManager.addMemory({
        content: `Retrieval test memory ${i}: ${["Successfully swapped tokens", "Successfully deposited collateral", "Successfully staked tokens"][Math.floor(Math.random() * 3)]} with ${Math.random().toFixed(2)}% profit`,
        type: "transaction_record",
        importance: Math.random(),
        metadata: {
          userId: "perf_test_user",
          protocol: ["AMM", "Lending", "Staking"][Math.floor(Math.random() * 3)],
          action: ["swap", "deposit", "stake"][Math.floor(Math.random() * 3)]
        }
      });
    }
    
    // Measure retrieval performance
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await agent.getScoredMemories("swap tokens", 5);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerQuery = totalTime / 10;
    
    console.log(`Memory Retrieval Performance: ${avgTimePerQuery.toFixed(2)}ms per query (${totalTime}ms total for 10 queries)`);
    
    // Expect average time per query to be reasonable (less than 1000ms)
    expect(avgTimePerQuery).toBeLessThan(1000);
  }, 15000); // 15 second timeout

  it("should measure context compression performance", async () => {
    // Pre-populate with test memories
    for (let i = 0; i < 30; i++) {
      await memoryManager.addMemory({
        content: `Context compression test memory ${i}: ${["Successfully executed complex DeFi strategy", "Successfully managed risk in volatile market", "Successfully optimized portfolio allocation"][Math.floor(Math.random() * 3)]}. Outcome: ${Math.random() > 0.5 ? "Profitable" : "Caution advised"}.`,
        type: Math.random() > 0.7 ? "strategy_outcome" : "transaction_record",
        importance: Math.random(),
        metadata: {
          userId: "perf_test_user",
          complexity: Math.floor(Math.random() * 10) + 1,
          outcome: Math.random() > 0.5 ? "profitable" : "caution"
        }
      });
    }
    
    // Measure context compression performance
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await agent.createMemoryAwarePrompt(
        "You are an AI assistant helping with DeFi operations. Consider past experiences when making recommendations.",
        "complex DeFi strategy execution",
        500
      );
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerCompression = totalTime / 10;
    
    console.log(`Context Compression Performance: ${avgTimePerCompression.toFixed(2)}ms per compression (${totalTime}ms total for 10 compressions)`);
    
    // Expect average time per compression to be reasonable (less than 1500ms)
    expect(avgTimePerCompression).toBeLessThan(1500);
  }, 20000); // 20 second timeout

  it("should measure relevance scoring performance", async () => {
    // Pre-populate with test memories
    const testMemories = [];
    for (let i = 0; i < 100; i++) {
      const memory = {
        id: `test-${i}`,
        content: `Relevance scoring test memory ${i}: ${["Successfully traded tokens", "Successfully managed portfolio", "Successfully executed strategy"][Math.floor(Math.random() * 3)]} in ${["AMM", "Lending", "Staking"][Math.floor(Math.random() * 3)]} protocol`,
        type: ["transaction_record", "strategy_outcome", "market_observation"][Math.floor(Math.random() * 3)] as any,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        importance: Math.random(),
        metadata: {
          userId: "perf_test_user",
          protocol: ["AMM", "Lending", "Staking"][Math.floor(Math.random() * 3)],
          action: ["trade", "manage", "execute"][Math.floor(Math.random() * 3)]
        }
      };
      testMemories.push(memory);
    }
    
    // Measure relevance scoring performance
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await agent.calculateRelevanceScore("execute trading strategy in AMM protocol", testMemories[i]);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerScore = totalTime / 100;
    
    console.log(`Relevance Scoring Performance: ${avgTimePerScore.toFixed(4)}ms per score (${totalTime}ms total for 100 scores)`);
    
    // Expect average time per score to be very fast (less than 10ms)
    expect(avgTimePerScore).toBeLessThan(10);
  });

  it("should measure temporal weighting performance", async () => {
    // Measure temporal weighting performance
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      const randomTimestamp = new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30)); // Random time within last 30 days
      memoryManager.calculateTemporalWeight(randomTimestamp);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerCalculation = totalTime / 1000;
    
    console.log(`Temporal Weighting Performance: ${avgTimePerCalculation.toFixed(4)}ms per calculation (${totalTime}ms total for 1000 calculations)`);
    
    // Expect average time per calculation to be extremely fast (less than 1ms)
    expect(avgTimePerCalculation).toBeLessThan(1);
  });
});