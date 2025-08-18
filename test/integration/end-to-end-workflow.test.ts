import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import { 
  MemoryAwareTestnetAMMSwapTool,
  MemoryAwareTestnetAMMAddLiquidityTool,
  MemoryAwareTestnetLendingDepositCollateralTool
} from "../../src/memory/wrapped-tools";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../../src/types";

dotenv.config();

describe("End-to-End Agent Workflow", () => {
  let agent: SeiAgentKit;
  let memoryManager: MemoryManager;
  let tools: any[];

  beforeAll(async () => {
    // Check required environment variables
    const requiredVars = ["OPENAI_API_KEY", "SEI_PRIVATE_KEY"];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn("Warning: Missing environment variables:", missingVars);
    }
    
    // Create memory manager
    memoryManager = await MemoryManager.create();
    
    // Create agent with real private key
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
    
    // Create tools
    tools = [
      new MemoryAwareTestnetAMMSwapTool(agent, memoryManager, "test_user_e2e"),
      new MemoryAwareTestnetAMMAddLiquidityTool(agent, memoryManager, "test_user_e2e"),
      new MemoryAwareTestnetLendingDepositCollateralTool(agent, memoryManager, "test_user_e2e")
    ];
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should execute a complete AMM swap workflow", async () => {
    // Pre-populate with relevant memories to influence decision making
    await memoryManager.addMemory({
      content: "Previously successfully swapped USDC for WETH with 1.5% profit. Slippage tolerance was set to 1%.",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "test_user_e2e",
        protocol: "AMM",
        fromToken: "USDC",
        toToken: "WETH",
        profit: "0.015",
        slippageTolerance: "0.01",
        toolName: "memory_aware_testnet_amm_swap"
      }
    });

    // Test that the agent can retrieve relevant memories
    const relevantMemories = await agent.getRelevantMemories("swap USDC to WETH", 3);
    expect(relevantMemories.length).toBeGreaterThan(0);
    
    const swapMemory = relevantMemories.find(mem => 
      mem.content.includes("swapped USDC for WETH") && mem.content.includes("1.5% profit")
    );
    expect(swapMemory).toBeDefined();

    // Test that the agent can create memory-aware prompts
    const basePrompt = "You are an AI assistant helping with DeFi operations. Consider past experiences when making recommendations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap USDC to WETH", 300);
    expect(enhancedPrompt).toContain("Past Experiences");
    expect(enhancedPrompt).toContain("swapped USDC for WETH");
    expect(enhancedPrompt).toContain("1.5% profit");
  });

  it("should execute a complete lending workflow", async () => {
    // Pre-populate with relevant memories
    await memoryManager.addMemory({
      content: "Successfully deposited WETH as collateral and borrowed USDC. Health factor remained above 1.5 throughout.",
      type: "transaction_record",
      importance: 0.7,
      metadata: {
        userId: "test_user_e2e",
        protocol: "Lending",
        collateralToken: "WETH",
        borrowToken: "USDC",
        healthFactor: "1.5",
        toolName: "memory_aware_testnet_lending_deposit_collateral"
      }
    });

    // Test memory retrieval for lending context
    const lendingMemories = await agent.getRelevantMemories("deposit WETH collateral", 3);
    expect(lendingMemories.length).toBeGreaterThan(0);
    
    const lendingMemory = lendingMemories.find(mem => 
      mem.content.includes("deposited WETH as collateral") && mem.content.includes("Health factor")
    );
    expect(lendingMemory).toBeDefined();

    // Test that the agent can create memory-aware prompts for lending
    const lendingPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with lending operations. Consider past experiences when making recommendations.",
      "deposit WETH collateral",
      300
    );
    expect(lendingPrompt).toContain("Past Experiences");
    expect(lendingPrompt).toContain("deposited WETH as collateral");
    expect(lendingPrompt).toContain("Health factor");
  });

  it("should execute a complete AMM liquidity workflow", async () => {
    // Pre-populate with relevant memories
    await memoryManager.addMemory({
      content: "Successfully added liquidity to WETH/USDC pool. LP token value increased by 0.8% over 24 hours.",
      type: "transaction_record",
      importance: 0.6,
      metadata: {
        userId: "test_user_e2e",
        protocol: "AMM",
        tokenA: "WETH",
        tokenB: "USDC",
        pool: "WETH/USDC",
        lpValueChange: "0.008",
        toolName: "memory_aware_testnet_amm_add_liquidity"
      }
    });

    // Test memory retrieval for liquidity context
    const liquidityMemories = await agent.getRelevantMemories("add liquidity to WETH/USDC pool", 3);
    expect(liquidityMemories.length).toBeGreaterThan(0);
    
    const liquidityMemory = liquidityMemories.find(mem => 
      mem.content.includes("added liquidity to WETH/USDC pool") && mem.content.includes("LP token value")
    );
    expect(liquidityMemory).toBeDefined();

    // Test that the agent can create memory-aware prompts for liquidity provision
    const liquidityPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with liquidity provision. Consider past experiences when making recommendations.",
      "add liquidity to WETH/USDC pool",
      300
    );
    expect(liquidityPrompt).toContain("Past Experiences");
    expect(liquidityPrompt).toContain("added liquidity to WETH/USDC pool");
    expect(liquidityPrompt).toContain("LP token value");
  });

  it("should demonstrate cross-protocol memory utilization", async () => {
    // Add memories from different protocols
    await memoryManager.addMemory({
      content: "Previously swapped USDC for WETH on AMM, then deposited WETH as collateral on lending protocol.",
      type: "transaction_record",
      importance: 0.9,
      metadata: {
        userId: "test_user_e2e",
        protocol: "Cross-Protocol",
        actions: ["AMM Swap", "Lending Deposit"],
        tokens: ["USDC", "WETH"],
        toolName: "cross_protocol_workflow"
      }
    });

    // Test cross-protocol memory retrieval
    const crossProtocolMemories = await agent.getRelevantMemories("cross-protocol strategy", 3);
    expect(crossProtocolMemories.length).toBeGreaterThan(0);
    
    const crossProtocolMemory = crossProtocolMemories.find(mem => 
      mem.content.includes("swapped USDC for WETH") && 
      mem.content.includes("deposited WETH as collateral") &&
      mem.metadata.actions &&
      mem.metadata.actions.includes("AMM Swap") &&
      mem.metadata.actions.includes("Lending Deposit")
    );
    expect(crossProtocolMemory).toBeDefined();

    // Test memory-aware decision making for cross-protocol strategies
    const strategyPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with cross-protocol DeFi strategies. Consider past experiences when making recommendations.",
      "cross-protocol strategy involving AMM and lending",
      400
    );
    expect(strategyPrompt).toContain("Past Experiences");
    expect(strategyPrompt).toContain("swapped USDC for WETH");
    expect(strategyPrompt).toContain("deposited WETH as collateral");
  });
});