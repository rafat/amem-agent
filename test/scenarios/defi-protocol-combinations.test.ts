import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../../src/types";

dotenv.config();

describe("Scenario-Based DeFi Protocol Combinations", () => {
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

  it("should handle AMM arbitrage scenario", async () => {
    // Pre-populate with relevant arbitrage memories
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
        gasUsed: "120000",
        toolName: "memory_aware_strategy_outcome",
        timestamp: new Date().toISOString()
      }
    });

    // Test memory retrieval for arbitrage context
    const arbitrageMemories = await agent.getRelevantMemories("AMM arbitrage strategy", 3);
    expect(arbitrageMemories.length).toBeGreaterThan(0);
    
    const arbitrageMemory = arbitrageMemories.find(mem => 
      mem.content.includes("AMM arbitrage") && 
      mem.content.includes("Pool A") && 
      mem.content.includes("Pool B") &&
      mem.content.includes("Net profit: 0.4%")
    );
    expect(arbitrageMemory).toBeDefined();

    // Test memory-aware prompt creation for arbitrage
    const arbitragePrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with AMM arbitrage strategies. Consider past successful executions when making recommendations.",
      "execute AMM arbitrage between WETH/USDC pools",
      400
    );
    expect(arbitragePrompt).toContain("AMM arbitrage");
    expect(arbitragePrompt).toContain("Pool A");
    expect(arbitragePrompt).toContain("Pool B");
    expect(arbitragePrompt).toContain("Net profit: 0.4%");
  });

  it("should handle yield farming scenario", async () => {
    // Pre-populate with relevant yield farming memories
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
        totalCombinedYield: "0.252",
        toolName: "memory_aware_strategy_outcome",
        timestamp: new Date().toISOString()
      }
    });

    // Test memory retrieval for yield farming context
    const yieldMemories = await agent.getRelevantMemories("yield farming strategy", 3);
    expect(yieldMemories.length).toBeGreaterThan(0);
    
    const yieldMemory = yieldMemories.find(mem => 
      mem.content.includes("yield farming strategy") && 
      mem.content.includes("Farm A") && 
      mem.content.includes("Staking Pool B") &&
      mem.content.includes("Total combined yield: 25.2% APY")
    );
    expect(yieldMemory).toBeDefined();

    // Test memory-aware prompt creation for yield farming
    const yieldPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with yield farming strategies. Consider past successful executions when making recommendations.",
      "execute yield farming strategy with multiple protocols",
      400
    );
    expect(yieldPrompt).toContain("yield farming strategy");
    expect(yieldPrompt).toContain("Farm A");
    expect(yieldPrompt).toContain("Staking Pool B");
    expect(yieldPrompt).toContain("Total combined yield: 25.2% APY");
  });

  it("should handle leveraged lending scenario", async () => {
    // Pre-populate with relevant leveraged lending memories
    await memoryManager.addMemory({
      content: "Successfully executed leveraged lending strategy: 1. Deposited 1 WETH as collateral (value: $2000). 2. Borrowed 1000 USDC (LTV: 50%). 3. Swapped USDC for WETH on AMM. 4. Deposited additional WETH as collateral. Final position: 1.5 WETH collateral, $3000 borrowing power. Effective leverage: 1.5x.",
      type: "strategy_outcome",
      importance: 0.85,
      metadata: {
        userId: "scenario_test_user",
        strategy: "Leveraged Lending",
        protocols: ["Lending", "AMM"],
        initialCollateral: "1 WETH",
        initialCollateralValue: "$2000",
        borrowedAmount: "1000 USDC",
        initialLtv: "0.50",
        finalCollateral: "1.5 WETH",
        borrowingPower: "$3000",
        effectiveLeverage: "1.5",
        toolName: "memory_aware_strategy_outcome",
        timestamp: new Date().toISOString()
      }
    });

    // Test memory retrieval for leveraged lending context
    const leveragedMemories = await agent.getRelevantMemories("leveraged lending strategy", 3);
    expect(leveragedMemories.length).toBeGreaterThan(0);
    
    const leveragedMemory = leveragedMemories.find(mem => 
      mem.content.includes("leveraged lending strategy") && 
      mem.content.includes("Deposited 1 WETH as collateral") && 
      mem.content.includes("Effective leverage: 1.5x")
    );
    expect(leveragedMemory).toBeDefined();

    // Test memory-aware prompt creation for leveraged lending
    const leveragedPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with leveraged lending strategies. Consider past successful executions and risk management when making recommendations.",
      "execute leveraged lending strategy with WETH collateral",
      400
    );
    expect(leveragedPrompt).toContain("leveraged lending strategy");
    expect(leveragedPrompt).toContain("Deposited 1 WETH as collateral");
    expect(leveragedPrompt).toContain("Effective leverage: 1.5x");
  });

  it("should handle risk management scenario", async () => {
    // Pre-populate with relevant risk management memories
    await memoryManager.addMemory({
      content: "Successfully executed risk management strategy during volatile market conditions: 1. Reduced leveraged positions by 30%. 2. Moved funds from high-risk AMM pools to stablecoin pools. 3. Increased collateral ratios to maintain healthy LTVs. 4. Set up automated stop-loss orders. Result: Protected 95% of portfolio value during 20% market correction.",
      type: "strategy_outcome",
      importance: 0.95,
      metadata: {
        userId: "scenario_test_user",
        strategy: "Risk Management",
        marketCondition: "Volatile",
        actionsTaken: [
          "Reduced leveraged positions by 30%",
          "Moved funds to stablecoin pools",
          "Increased collateral ratios",
          "Set up automated stop-loss orders"
        ],
        marketCorrection: "20%",
        portfolioProtection: "95%",
        toolName: "memory_aware_strategy_outcome",
        timestamp: new Date().toISOString()
      }
    });

    // Test memory retrieval for risk management context
    const riskMemories = await agent.getRelevantMemories("risk management during volatile markets", 3);
    expect(riskMemories.length).toBeGreaterThan(0);
    
    const riskMemory = riskMemories.find(mem => 
      mem.content.includes("risk management strategy") && 
      mem.content.includes("volatile market conditions") && 
      mem.content.includes("Protected 95% of portfolio value")
    );
    expect(riskMemory).toBeDefined();

    // Test memory-aware prompt creation for risk management
    const riskPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with risk management strategies. Consider past successful executions during volatile market conditions when making recommendations.",
      "implement risk management during volatile market conditions",
      400
    );
    expect(riskPrompt).toContain("risk management strategy");
    expect(riskPrompt).toContain("volatile market conditions");
    expect(riskPrompt).toContain("Protected 95% of portfolio value");
  });

  it("should handle cross-protocol optimization scenario", async () => {
    // Pre-populate with relevant cross-protocol optimization memories
    await memoryManager.addMemory({
      content: "Successfully executed cross-protocol optimization strategy: 1. Identified highest yielding opportunities across AMM, Lending, and Staking protocols. 2. Allocated funds dynamically based on yield changes. 3. Rebalanced portfolio weekly to maintain optimal risk-adjusted returns. 4. Used flash loans for atomic arbitrage opportunities. Result: Achieved 32% APY with 12% volatility.",
      type: "strategy_outcome",
      importance: 0.9,
      metadata: {
        userId: "scenario_test_user",
        strategy: "Cross-Protocol Optimization",
        protocolsOptimized: ["AMM", "Lending", "Staking"],
        rebalanceFrequency: "weekly",
        finalApy: "0.32",
        volatility: "0.12",
        optimizationTechniques: [
          "Dynamic fund allocation",
          "Weekly rebalancing",
          "Flash loan arbitrage"
        ],
        toolName: "memory_aware_strategy_outcome",
        timestamp: new Date().toISOString()
      }
    });

    // Test memory retrieval for cross-protocol optimization context
    const optimizationMemories = await agent.getRelevantMemories("cross-protocol optimization strategy", 3);
    expect(optimizationMemories.length).toBeGreaterThan(0);
    
    const optimizationMemory = optimizationMemories.find(mem => 
      mem.content.includes("cross-protocol optimization strategy") && 
      mem.content.includes("highest yielding opportunities") && 
      mem.content.includes("Achieved 32% APY with 12% volatility")
    );
    expect(optimizationMemory).toBeDefined();

    // Test memory-aware prompt creation for cross-protocol optimization
    const optimizationPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with cross-protocol optimization strategies. Consider past successful executions when making recommendations.",
      "execute cross-protocol optimization strategy for maximum risk-adjusted returns",
      400
    );
    expect(optimizationPrompt).toContain("cross-protocol optimization strategy");
    expect(optimizationPrompt).toContain("highest yielding opportunities");
    expect(optimizationPrompt).toContain("Achieved 32% APY with 12% volatility");
  });
});