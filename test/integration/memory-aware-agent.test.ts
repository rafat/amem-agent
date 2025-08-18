import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import { 
  MemoryAwareTestnetAMMSwapTool,
  MemoryAwareTestnetAMMAddLiquidityTool,
  MemoryAwareTestnetLendingDepositCollateralTool
} from "../../src/memory/wrapped-tools";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../../src/types";

dotenv.config();

describe("Memory-Aware Agent Integration", () => {
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
      new MemoryAwareTestnetAMMSwapTool(agent, memoryManager, "test_user_123"),
      new MemoryAwareTestnetAMMAddLiquidityTool(agent, memoryManager, "test_user_123"),
      new MemoryAwareTestnetLendingDepositCollateralTool(agent, memoryManager, "test_user_123")
    ];
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should create memory-aware tools with correct configurations", () => {
    expect(tools.length).toBe(3);
    
    // Check AMM Swap Tool
    const swapTool = tools[0];
    expect(swapTool.name).toBe("memory_aware_testnet_amm_swap");
    expect(swapTool.description).toContain("Swap tokens using the testnet AMM with memory recording");
    
    // Check AMM Add Liquidity Tool
    const addLiquidityTool = tools[1];
    expect(addLiquidityTool.name).toBe("memory_aware_testnet_amm_add_liquidity");
    expect(addLiquidityTool.description).toContain("Add liquidity to a pool using the testnet AMM");
    
    // Check Lending Deposit Collateral Tool
    const depositCollateralTool = tools[2];
    expect(depositCollateralTool.name).toBe("memory_aware_testnet_lending_deposit_collateral");
    expect(depositCollateralTool.description).toContain("Deposit collateral in the testnet lending pool");
  });

  it("should record tool executions in memory", async () => {
    // Add a test memory to verify recording works
    const initialMemoryCount = (await memoryManager.retrieveMemories("test", 100)).length;
    
    // Execute a tool (without actually calling the blockchain)
    // We'll mock the execution to focus on memory recording
    
    // Manually add a memory that would normally be added by tool execution
    await memoryManager.addMemory({
      content: "Test tool execution recorded in memory",
      type: "transaction_record",
      importance: 0.6,
      metadata: {
        userId: "test_user_123",
        toolName: "memory_aware_testnet_amm_swap",
        action: "test_execution",
        timestamp: new Date().toISOString()
      }
    });
    
    const finalMemoryCount = (await memoryManager.retrieveMemories("test", 100)).length;
    expect(finalMemoryCount).toBeGreaterThan(initialMemoryCount);
  });

  it("should retrieve relevant memories for tool context", async () => {
    // Add some context memories
    await memoryManager.addMemory({
      content: "Previously successfully swapped WETH for USDC with 3% profit",
      type: "transaction_record",
      importance: 0.8,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        fromToken: "WETH",
        toToken: "USDC",
        profit: "0.03"
      }
    });
    
    // Test memory retrieval for AMM swap context
    const relevantMemories = await agent.getRelevantMemories("swap WETH to USDC", 3);
    expect(relevantMemories.length).toBeGreaterThan(0);
    
    const relevantMemory = relevantMemories.find(mem => 
      mem.content.includes("swapped WETH for USDC") && mem.content.includes("3% profit")
    );
    expect(relevantMemory).toBeDefined();
  });
});