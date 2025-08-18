import { SeiAgentKit } from "../agent";
import { MemoryManager } from "../memory/manager";
import { ModelProviderName } from "../types";

async function runPerformanceBenchmark() {
  console.log("Running Memory-Based Decision Making Performance Benchmark...\n");
  
  try {
    // Create memory manager
    const memoryManager = await MemoryManager.create();
    
    // Use the actual private key from environment variables
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    
    // Create agent with memory manager
    const agent = new SeiAgentKit(
      privateKey,
      ModelProviderName.OPENAI,
      memoryManager
    );
    
    // Pre-populate with test memories
    console.log("Pre-populating with test memories...");
    const startTime = Date.now();
    
    // Add 100 test memories
    for (let i = 0; i < 100; i++) {
      await memoryManager.addMemory({
        content: `Test memory ${i}: Successfully performed DeFi operation with ${Math.random().toFixed(2)}% profit`,
        type: "transaction_record",
        importance: Math.random(),
        metadata: {
          userId: "test_user_123",
          protocol: ["AMM", "Lending", "Staking"][Math.floor(Math.random() * 3)],
          fromToken: ["WETH", "USDC", "DAI"][Math.floor(Math.random() * 3)],
          toToken: ["USDC", "DAI", "WETH"][Math.floor(Math.random() * 3)],
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString() // Random time within last 24 hours
        }
      });
    }
    
    const populateTime = Date.now() - startTime;
    console.log(`✓ Populated 100 memories in ${populateTime}ms\n`);
    
    // Benchmark memory retrieval
    console.log("Benchmarking memory retrieval performance...");
    
    // Test 1: Single memory retrieval
    const retrievalStartTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await agent.getScoredMemories("swap tokens", 5);
    }
    const retrievalTime = Date.now() - retrievalStartTime;
    const avgRetrievalTime = retrievalTime / 10;
    console.log(`✓ Average retrieval time: ${avgRetrievalTime.toFixed(2)}ms\n`);
    
    // Test 2: Context compression performance
    console.log("Benchmarking context compression performance...");
    const compressionStartTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await agent.createMemoryAwarePrompt("You are an AI assistant.", "swap tokens", 500);
    }
    const compressionTime = Date.now() - compressionStartTime;
    const avgCompressionTime = compressionTime / 10;
    console.log(`✓ Average compression time: ${avgCompressionTime.toFixed(2)}ms\n`);
    
    // Test 3: Relevance scoring performance
    console.log("Benchmarking relevance scoring performance...");
    const scoringStartTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await agent.calculateRelevanceScore("swap tokens", {
        id: `test-${i}`,
        content: `Test memory content ${i}`,
        type: "transaction_record",
        timestamp: new Date(),
        importance: 0.5,
        metadata: {}
      });
    }
    const scoringTime = Date.now() - scoringStartTime;
    const avgScoringTime = scoringTime / 100;
    console.log(`✓ Average scoring time: ${avgScoringTime.toFixed(2)}ms\n`);
    
    // Test 4: Temporal weighting performance
    console.log("Benchmarking temporal weighting performance...");
    const temporalStartTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      memoryManager.calculateTemporalWeight(new Date(Date.now() - Math.floor(Math.random() * 86400000)));
    }
    const temporalTime = Date.now() - temporalStartTime;
    const avgTemporalTime = temporalTime / 1000;
    console.log(`✓ Average temporal weighting time: ${avgTemporalTime.toFixed(4)}ms\n`);
    
    // Overall performance metrics
    console.log("Overall Performance Metrics:");
    console.log(`✓ Total test time: ${Date.now() - startTime}ms`);
    console.log(`✓ Memory storage rate: ${(100 / populateTime * 1000).toFixed(2)} memories/sec`);
    console.log(`✓ Memory retrieval rate: ${(10 / retrievalTime * 1000).toFixed(2)} queries/sec`);
    console.log(`✓ Context compression rate: ${(10 / compressionTime * 1000).toFixed(2)} compressions/sec`);
    
    // Clean up
    await memoryManager.close();
    
    console.log("\n✅ Performance benchmark completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Performance benchmark failed:", error);
    return false;
  }
}

// Run the performance benchmark
runPerformanceBenchmark().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error("Benchmark execution error:", error);
  process.exit(1);
});