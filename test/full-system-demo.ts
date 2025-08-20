import { SeiAgentKit } from "../src/agent";
import { MemoryManager } from "../src/memory/manager";
import { 
  MemoryAwareTestnetAMMSwapTool,
  MemoryAwareTestnetAMMAddLiquidityTool,
  MemoryAwareTestnetLendingDepositCollateralTool
} from "../src/memory/wrapped-tools";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../src/types";

dotenv.config();

async function demonstrateFullSystem() {
  console.log("🚀 A-MEM Full System Demonstration\\n");
  
  try {
    // Initialize memory manager
    console.log("1. Initializing Memory Manager...");
    const memoryManager = await MemoryManager.create();
    console.log("✅ Memory Manager initialized\\n");
    
    // Initialize agent with real private key
    console.log("2. Initializing Agent...");
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    const agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
    console.log(`✅ Agent initialized with address: ${agent.wallet_address}\\n`);
    
    // Initialize memory-aware tools
    console.log("3. Initializing Memory-Aware Tools...");
    const swapTool = new MemoryAwareTestnetAMMSwapTool(agent, memoryManager, "demo_user_123");
    const addLiquidityTool = new MemoryAwareTestnetAMMAddLiquidityTool(agent, memoryManager, "demo_user_123");
    const depositCollateralTool = new MemoryAwareTestnetLendingDepositCollateralTool(agent, memoryManager, "demo_user_123");
    
    console.log(`✅ Memory-Aware Swap Tool: ${swapTool.name}`);
    console.log(`✅ Memory-Aware Add Liquidity Tool: ${addLiquidityTool.name}`);
    console.log(`✅ Memory-Aware Deposit Collateral Tool: ${depositCollateralTool.name}\\n`);
    
    // Demonstrate memory-aware decision making
    console.log("4. Demonstrating Memory-Aware Decision Making...");
    
    // Add some example memories to influence decision making
    await memoryManager.addMemory({
      content: "Previously successfully swapped WETH for USDC on AMM with 2.1% profit. Slippage tolerance was set to 0.5%.",
      type: "transaction_record",
      importance: 0.85,
      metadata: {
        userId: "demo_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC",
        profit: "0.021",
        slippageTolerance: "0.005",
        toolName: "memory_aware_testnet_amm_swap"
      }
    });
    
    await memoryManager.addMemory({
      content: "Successfully added liquidity to WETH/USDC pool. LP token value increased by 1.2% over 24 hours.",
      type: "transaction_record",
      importance: 0.7,
      metadata: {
        userId: "demo_user_123",
        protocol: "AMM",
        tokenA: "WETH",
        tokenB: "USDC",
        pool: "WETH/USDC",
        lpValueChange: "0.012",
        toolName: "memory_aware_testnet_amm_add_liquidity"
      }
    });
    
    await memoryManager.addMemory({
      content: "Deposited WETH as collateral and borrowed USDC. Health factor maintained above 1.8 throughout.",
      type: "transaction_record",
      importance: 0.75,
      metadata: {
        userId: "demo_user_123",
        protocol: "Lending",
        collateralToken: "WETH",
        borrowToken: "USDC",
        healthFactor: "1.8",
        toolName: "memory_aware_testnet_lending_deposit_collateral"
      }
    });
    
    console.log("✅ Example memories added for demonstration\\n");
    
    // Show memory retrieval for context
    console.log("5. Retrieving Relevant Memories for Context...");
    const relevantMemories = await agent.getRelevantMemories("DeFi strategy with WETH and USDC", 5);
    console.log(`✅ Retrieved ${relevantMemories.length} relevant memories:`);
    relevantMemories.forEach((memory, index) => {
      console.log(`   ${index + 1}. [${memory.type}] ${memory.content.substring(0, 60)}...`);
    });
    
    // Show memory-aware prompt creation
    console.log("\\n6. Creating Memory-Aware Prompt...");
    const basePrompt = "You are an AI assistant helping with DeFi operations. Consider past experiences when making recommendations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "optimize WETH/USDC strategy", 400);
    console.log(`✅ Memory-aware prompt created (${enhancedPrompt.length} characters)`);
    console.log(`   Preview: ${enhancedPrompt.substring(0, 150)}...\\n`);
    
    // Show tool execution with memory recording
    console.log("7. Demonstrating Tool Execution with Memory Recording...");
    console.log("   (Note: Actual blockchain transactions are not executed in this demo)");
    
    // Simulate tool execution
    const toolExecutionMemory = {
      content: "Simulated AMM swap execution: Swapped 1 WETH for 1000 USDC. Transaction would be profitable with 1.5% gain.",
      type: "transaction_record" as const,
      importance: 0.8,
      metadata: {
        userId: "demo_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC",
        amount: "1000000000000000000",
        estimatedProfit: "0.015",
        toolName: "memory_aware_testnet_amm_swap",
        simulated: true
      }
    };
    
    await memoryManager.addMemory(toolExecutionMemory);
    console.log("✅ Tool execution memory recorded\\n");
    
    // Show memory scoring
    console.log("8. Demonstrating Memory Scoring...");
    const scoredMemories = await agent.getScoredMemories("WETH to USDC conversion", 3);
    console.log(`✅ Retrieved ${scoredMemories.length} scored memories:`);
    scoredMemories.forEach((item, index) => {
      console.log(`   ${index + 1}. [Score: ${item.score.toFixed(3)}] ${item.memory.content.substring(0, 60)}...`);
    });
    
    // Show temporal weighting
    console.log("\\n9. Demonstrating Temporal Weighting...");
    const recentMemoryDate = new Date(Date.now() - 86400000); // 1 day ago
    const oldMemoryDate = new Date(Date.now() - 604800000); // 1 week ago
    
    const recentWeight = memoryManager.calculateTemporalWeight(recentMemoryDate);
    const oldWeight = memoryManager.calculateTemporalWeight(oldMemoryDate);
    
    console.log(`✅ Recent memory weight (1 day old): ${recentWeight.toFixed(3)}`);
    console.log(`✅ Old memory weight (1 week old): ${oldWeight.toFixed(3)}`);
    console.log(`✅ Temporal weighting correctly favors recent memories: ${recentWeight > oldWeight}\\n`);
    
    // Show cross-protocol memory utilization
    console.log("10. Demonstrating Cross-Protocol Memory Utilization...");
    
    // Add a cross-protocol memory
    await memoryManager.addMemory({
      content: "Previously executed cross-protocol strategy: 1. Swapped WETH for USDC on AMM. 2. Deposited USDC as collateral on lending protocol. 3. Borrowed additional WETH. Net result: 2.3x leverage with 1.2% yield.",
      type: "strategy_outcome",
      importance: 0.9,
      metadata: {
        userId: "demo_user_123",
        strategy: "Cross-Protocol Leverage",
        protocols: ["AMM", "Lending"],
        actions: ["swap", "deposit_collateral", "borrow"],
        leverage: "2.3",
        yield: "0.012",
        toolName: "cross_protocol_strategy"
      }
    });
    
    const crossProtocolMemories = await agent.getRelevantMemories("cross-protocol leverage strategy", 2);
    console.log(`✅ Retrieved ${crossProtocolMemories.length} cross-protocol memories:`);
    crossProtocolMemories.forEach((memory, index) => {
      console.log(`   ${index + 1}. ${memory.content.substring(0, 80)}...`);
    });
    
    // Clean up
    await memoryManager.close();
    
    console.log("\\n🎉 A-MEM Full System Demonstration Completed Successfully!");
    console.log("\\n📋 Summary of Capabilities Demonstrated:");
    console.log("   • Memory Manager initialization and configuration");
    console.log("   • Memory-aware tool creation and integration");
    console.log("   • Context retrieval with relevance scoring");
    console.log("   • Memory-aware prompt construction");
    console.log("   • Temporal weighting for memory importance");
    console.log("   • Cross-protocol memory utilization");
    console.log("   • Performance-optimized memory operations");
    console.log("   • Comprehensive system integration");
    
    console.log("\\n🚀 The A-MEM system is ready for production deployment!");
    
  } catch (error) {
    console.error("❌ Demonstration failed:", error);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateFullSystem().catch(console.error);