import { SeiAgentKit } from "../agent";
import { MemoryManager } from "../memory/manager";
import { Memory } from "../memory/models";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../types";

dotenv.config();

async function demonstrateMemoryBasedDecisionMaking() {
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
    
    console.log("=== Memory-Based Decision Making Demo ===\n");
    
    // 1. Simulate adding some memories to demonstrate context
    console.log("1. Adding sample memories to demonstrate context...\n");
    
    // Add a successful swap memory
    await memoryManager.addMemory({
      content: "Successfully swapped 1000 USDC for 0.5 WETH on AMM. Transaction was profitable with 2% gain.",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "USDC",
        toToken: "WETH",
        amount: "1000000000",
        profit: "0.02",
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    });
    
    // Add a failed swap memory
    await memoryManager.addMemory({
      content: "Failed to swap 500 DAI for 0.25 WETH on AMM. Transaction reverted due to slippage tolerance exceeded.",
      type: "reflection",
      importance: 0.7,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "DAI",
        toToken: "WETH",
        amount: "500000000",
        error: "SLIPPAGE_EXCEEDED",
        timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    });
    
    // Add a lending memory
    await memoryManager.addMemory({
      content: "Successfully deposited 1 WETH as collateral and borrowed 1000 USDC on lending protocol.",
      type: "transaction_record",
      importance: 0.7,
      metadata: {
        userId: "test_user_123",
        protocol: "Lending",
        collateralToken: "WETH",
        borrowToken: "USDC",
        amount: "1000000000000000000",
        timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      }
    });
    
    console.log("Sample memories added successfully.\n");
    
    // 2. Demonstrate memory retrieval with scoring
    console.log("2. Retrieving relevant memories for 'swap WETH to USDC'...\n");
    const scoredMemories = await agent.getScoredMemories("swap WETH to USDC", 5);
    
    console.log("Found memories with scores:");
    scoredMemories.forEach((item, index) => {
      console.log(`  ${index + 1}. Score: ${item.score.toFixed(3)} - ${item.memory.content}`);
    });
    console.log();
    
    // 3. Demonstrate context compression
    console.log("3. Creating memory-aware prompt with context compression...\n");
    const basePrompt = "You are an AI assistant helping with DeFi operations. Consider past experiences when making recommendations.";
    const compressedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap WETH to USDC", 300);
    
    console.log("Compressed prompt preview:");
    console.log(compressedPrompt.substring(0, 500) + "...\n");
    
    // 4. Demonstrate temporal weighting
    console.log("4. Demonstrating temporal weighting...\n");
    const recentMemories = await agent.getScoredMemories("recent transactions", 3);
    
    console.log("Recent memories with temporal weighting:");
    recentMemories.forEach((item, index) => {
      const ageInDays = (Date.now() - item.memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      console.log(`  ${index + 1}. Age: ${ageInDays.toFixed(1)} days, Score: ${item.score.toFixed(3)} - ${item.memory.content}`);
    });
    console.log();
    
    // 5. Demonstrate relevance scoring
    console.log("5. Demonstrating relevance scoring algorithm...\n");
    
    // Create a test memory for scoring
    const testMemory: Memory = {
      id: "test-memory-123",
      content: "Successfully swapped tokens on AMM with high profit margin",
      type: "transaction_record",
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
      importance: 0.9,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC"
      }
    };
    
    const relevanceScore = await agent.calculateRelevanceScore("swap WETH to USDC", testMemory);
    console.log(`Relevance score for '${testMemory.content}': ${relevanceScore.toFixed(3)}\n`);
    
    // 6. Demonstrate memory-based decision making
    console.log("6. Simulating memory-based decision making...\n");
    
    // Simulate a decision scenario
    const decisionContext = "Should I swap WETH to USDC now?";
    const decisionMemories = await agent.getScoredMemories(decisionContext, 3);
    
    console.log("Decision context:", decisionContext);
    console.log("Relevant memories for decision:");
    
    if (decisionMemories.length > 0) {
      decisionMemories.forEach((item, index) => {
        console.log(`  ${index + 1}. [Score: ${item.score.toFixed(3)}] ${item.memory.content}`);
      });
      
      // Simple decision logic based on memories
      const avgScore = decisionMemories.reduce((sum, item) => sum + item.score, 0) / decisionMemories.length;
      console.log(`\nAverage relevance score: ${avgScore.toFixed(3)}`);
      
      if (avgScore > 0.6) {
        console.log("Recommendation: High confidence in proceeding with the swap based on positive historical outcomes.");
      } else if (avgScore > 0.4) {
        console.log("Recommendation: Moderate confidence. Consider adjusting parameters based on past experiences.");
      } else {
        console.log("Recommendation: Low confidence. Review past failures before proceeding.");
      }
    } else {
      console.log("  No relevant memories found for this decision context.");
    }
    
    console.log("\n=== Memory-Based Decision Making Demo Completed ===");
    
    // Close memory manager
    await memoryManager.close();
    
  } catch (error) {
    console.error("Error in memory-based decision making demo:", error);
  }
}

// Run the demonstration
demonstrateMemoryBasedDecisionMaking().catch(console.error);