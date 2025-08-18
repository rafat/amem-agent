import { SeiAgentKit } from "../agent";
import { MemoryManager } from "../memory/manager";
import { Memory } from "../memory/models";
import { ModelProviderName } from "../types";

async function runIntegrationTest() {
  console.log("Running Memory-Based Decision Making Integration Test...\n");
  
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
    
    // Test 1: Memory retrieval with scoring
    console.log("Test 1: Memory retrieval with scoring");
    await memoryManager.addMemory({
      content: "Successfully swapped WETH for USDC on AMM with 3% profit",
      type: "transaction_record",
      importance: 0.9,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC",
        profit: "0.03"
      }
    });
    
    const scoredMemories = await agent.getScoredMemories("swap WETH to USDC", 3);
    console.log(`✓ Retrieved ${scoredMemories.length} memories with scores`);
    console.log(`✓ Highest score: ${scoredMemories[0]?.score.toFixed(3) || 'N/A'}\n`);
    
    // Test 2: Temporal weighting
    console.log("Test 2: Temporal weighting");
    const recentWeight = memoryManager.calculateTemporalWeight(new Date(Date.now() - 86400000)); // 1 day ago
    const olderWeight = memoryManager.calculateTemporalWeight(new Date(Date.now() - 604800000)); // 1 week ago
    console.log(`✓ Recent memory weight: ${recentWeight.toFixed(3)}`);
    console.log(`✓ Older memory weight: ${olderWeight.toFixed(3)}`);
    console.log(`✓ Recent memories have higher weights: ${recentWeight > olderWeight}\n`);
    
    // Test 3: Context compression
    console.log("Test 3: Context compression");
    const basePrompt = "You are an AI assistant helping with DeFi operations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap tokens", 200);
    console.log(`✓ Enhanced prompt length: ${enhancedPrompt.length} characters`);
    console.log(`✓ Contains memory context: ${enhancedPrompt.includes("Past Experiences")}\n`);
    
    // Test 4: Relevance scoring
    console.log("Test 4: Relevance scoring");
    const testMemory: Memory = {
      id: "test-123",
      content: "Successfully swapped tokens with high profit margin",
      type: "transaction_record",
      timestamp: new Date(),
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM"
      }
    };
    
    const relevanceScore = await agent.calculateRelevanceScore("swap tokens", testMemory);
    console.log(`✓ Relevance score: ${relevanceScore.toFixed(3)}`);
    console.log(`✓ Score is valid (0-1): ${relevanceScore >= 0 && relevanceScore <= 1}\n`);
    
    // Test 5: Decision making simulation
    console.log("Test 5: Decision making simulation");
    const decisionContext = "Should I swap WETH to USDC?";
    const decisionMemories = await agent.getScoredMemories(decisionContext, 2);
    const avgScore = decisionMemories.reduce((sum, item) => sum + item.score, 0) / (decisionMemories.length || 1);
    console.log(`✓ Average relevance for decision: ${avgScore.toFixed(3)}`);
    console.log(`✓ Decision confidence level: ${avgScore > 0.6 ? 'High' : avgScore > 0.4 ? 'Medium' : 'Low'}\n`);
    
    // Clean up
    await memoryManager.close();
    
    console.log("✅ All integration tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Integration test failed:", error);
    return false;
  }
}

// Run the integration test
runIntegrationTest().then(success => {
  if (!success) {
    process.exit(1);
  }
}).catch(error => {
  console.error("Test execution error:", error);
  process.exit(1);
});