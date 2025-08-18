import { MemoryManager } from "../src/memory/manager";
import { SeiAgentKit } from "../src/agent";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../src/types";

dotenv.config();

async function runUnitTests() {
  console.log("🧪 Running Unit Tests...\n");
  
  try {
    // Test 1: MemoryManager basic functionality
    console.log("Test 1: MemoryManager basic functionality");
    const memoryManager = await MemoryManager.create();
    
    const testMemory = {
      content: "Test memory for unit testing",
      type: "user_preference" as const,
      importance: 0.5,
      metadata: {
        test: true,
        userId: "test-user-123"
      }
    };

    const memoryId = await memoryManager.addMemory(testMemory);
    console.log(`✓ Added memory with ID: ${memoryId}`);

    const retrievedMemories = await memoryManager.retrieveMemories("test memory", 5);
    console.log(`✓ Retrieved ${retrievedMemories.length} memories`);
    
    const testMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    if (testMemoryFound) {
      console.log("✓ Memory correctly retrieved and stored");
    } else {
      console.log("❌ Memory not found after storage");
      return false;
    }
    
    // Test 2: Temporal weighting
    console.log("\nTest 2: Temporal weighting");
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000); // 1 day ago
    const oneWeekAgo = new Date(now.getTime() - 604800000); // 1 week ago
    
    const recentWeight = memoryManager.calculateTemporalWeight(oneDayAgo);
    const olderWeight = memoryManager.calculateTemporalWeight(oneWeekAgo);
    
    if (recentWeight > olderWeight) {
      console.log("✓ Temporal weighting correctly favors recent memories");
    } else {
      console.log("❌ Temporal weighting not working correctly");
      return false;
    }
    
    // Test 3: MemoryManager with scores
    console.log("\nTest 3: MemoryManager with scores");
    const scoredMemories = await memoryManager.retrieveMemoriesWithScores("test memory", 5);
    console.log(`✓ Retrieved ${scoredMemories.length} scored memories`);
    
    const allHaveScores = scoredMemories.every(item => 
      typeof item.score === 'number' && item.score >= 0 && item.score <= 1
    );
    
    if (allHaveScores) {
      console.log("✓ All memories have valid scores");
    } else {
      console.log("❌ Some memories missing valid scores");
      return false;
    }
    
    // Clean up
    await memoryManager.close();
    
    console.log("\n✅ All unit tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Unit test failed:", error);
    return false;
  }
}

async function runIntegrationTests() {
  console.log("\n🧪 Running Integration Tests...\n");
  
  try {
    // Test 1: Agent with memory capabilities
    console.log("Test 1: Agent with memory capabilities");
    const memoryManager = await MemoryManager.create();
    
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    const agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
    
    // Add a test memory
    await memoryManager.addMemory({
      content: "Successfully swapped WETH for USDC on AMM",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "integration_test_user",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC"
      }
    });
    
    // Test memory retrieval
    const memories = await agent.getRelevantMemories("swap tokens", 3);
    console.log(`✓ Retrieved ${memories.length} relevant memories`);
    
    const relevantMemory = memories.find(mem => mem.content.includes("swapped WETH for USDC"));
    if (relevantMemory) {
      console.log("✓ Agent correctly retrieves relevant memories");
    } else {
      console.log("❌ Agent failed to retrieve relevant memories");
      await memoryManager.close();
      return false;
    }
    
    // Test memory scoring
    console.log("\nTest 2: Memory scoring");
    const scoredMemories = await agent.getScoredMemories("swap tokens", 3);
    console.log(`✓ Retrieved ${scoredMemories.length} scored memories`);
    
    const allScored = scoredMemories.every(item => 
      typeof item.score === 'number' && item.score >= 0 && item.score <= 1
    );
    
    if (allScored) {
      console.log("✓ Agent correctly scores memories");
    } else {
      console.log("❌ Agent failed to score memories correctly");
      await memoryManager.close();
      return false;
    }
    
    // Test memory-aware prompt creation
    console.log("\nTest 3: Memory-aware prompt creation");
    const basePrompt = "You are an AI assistant helping with DeFi operations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap tokens", 300);
    
    if (enhancedPrompt.length > basePrompt.length && enhancedPrompt.includes("Past Experiences")) {
      console.log("✓ Agent correctly creates memory-aware prompts");
    } else {
      console.log("❌ Agent failed to create memory-aware prompts");
      await memoryManager.close();
      return false;
    }
    
    // Clean up
    await memoryManager.close();
    
    console.log("\n✅ All integration tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Integration test failed:", error);
    return false;
  }
}

async function runScenarioTests() {
  console.log("\n🧪 Running Scenario Tests...\n");
  
  try {
    // Test 1: AMM arbitrage scenario
    console.log("Test 1: AMM arbitrage scenario");
    const memoryManager = await MemoryManager.create();
    
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    const agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
    
    // Add arbitrage memories
    await memoryManager.addMemory({
      content: "Successfully executed AMM arbitrage between Pool A (WETH/USDC) and Pool B (WETH/USDC). Bought low at Pool A (99.8 USDC/WETH) and sold high at Pool B (100.2 USDC/WETH). Net profit: 0.4% after gas fees.",
      type: "strategy_outcome",
      importance: 0.9,
      metadata: {
        userId: "scenario_test_user",
        strategy: "AMM Arbitrage",
        protocol: "AMM",
        tokenPair: "WETH/USDC",
        buyPrice: "99.8",
        sellPrice: "100.2",
        netProfit: "0.004",
        gasUsed: "120000"
      }
    });
    
    // Test scenario memory retrieval
    const arbitrageMemories = await agent.getRelevantMemories("AMM arbitrage strategy", 3);
    console.log(`✓ Retrieved ${arbitrageMemories.length} arbitrage memories`);
    
    const arbitrageMemory = arbitrageMemories.find(mem => 
      mem.content.includes("AMM arbitrage") && mem.content.includes("Pool A") && mem.content.includes("Pool B")
    );
    
    if (arbitrageMemory) {
      console.log("✓ Agent correctly handles arbitrage scenario memories");
    } else {
      console.log("❌ Agent failed to handle arbitrage scenario memories");
      await memoryManager.close();
      return false;
    }
    
    // Test 2: Yield farming scenario
    console.log("\nTest 2: Yield farming scenario");
    await memoryManager.addMemory({
      content: "Successfully executed yield farming strategy: 1. Deposited WETH/USDC LP tokens in Farm A (APY: 15%). 2. Staked reward tokens in Staking Pool B (APR: 8%). 3. Provided liquidity in additional pool for extra incentives. Total combined yield: 25.2% APY.",
      type: "strategy_outcome",
      importance: 0.8,
      metadata: {
        userId: "scenario_test_user",
        strategy: "Yield Farming",
        protocols: ["AMM", "Farm", "Staking"],
        assets: ["WETH/USDC LP", "Reward Token"],
        farmApy: "0.15",
        stakingApr: "0.08",
        totalCombinedYield: "0.252"
      }
    });
    
    const yieldMemories = await agent.getRelevantMemories("yield farming strategy", 3);
    console.log(`✓ Retrieved ${yieldMemories.length} yield farming memories`);
    
    const yieldMemory = yieldMemories.find(mem => 
      mem.content.includes("yield farming strategy") && mem.content.includes("Total combined yield: 25.2% APY")
    );
    
    if (yieldMemory) {
      console.log("✓ Agent correctly handles yield farming scenario memories");
    } else {
      console.log("❌ Agent failed to handle yield farming scenario memories");
      await memoryManager.close();
      return false;
    }
    
    // Clean up
    await memoryManager.close();
    
    console.log("\n✅ All scenario tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Scenario test failed:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting A-MEM Comprehensive Test Suite...\n");
  
  const startTime = Date.now();
  
  // Run all test suites
  const unitTestsPassed = await runUnitTests();
  const integrationTestsPassed = await runIntegrationTests();
  const scenarioTestsPassed = await runScenarioTests();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log("\n📊 Test Execution Summary:");
  console.log(`⏱️  Total execution time: ${totalTime}ms`);
  console.log(`✅ Unit Tests: ${unitTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Integration Tests: ${integrationTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Scenario Tests: ${scenarioTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  if (unitTestsPassed && integrationTestsPassed && scenarioTestsPassed) {
    console.log("\n🎉 All test suites passed! 🎉");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some test suites failed. ⚠️");
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error("Test execution failed:", error);
  process.exit(1);
});