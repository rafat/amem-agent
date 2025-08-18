import { MemoryManager } from "../src/memory/manager";
import { SeiAgentKit } from "../src/agent";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../src/types";

dotenv.config();

async function runScenarioTests() {
  console.log("🧪 Running Scenario Tests...\n");
  
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
      console.log("Available memories:");
      yieldMemories.forEach((mem, idx) => {
        console.log(`  ${idx + 1}. ${mem.content}`);
      });
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
  const result = await runScenarioTests();
  if (result) {
    console.log("✅ Scenario tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Scenario tests failed!");
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error("Test execution failed:", error);
  process.exit(1);
});