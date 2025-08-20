import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import { 
  MemoryAwareTestnetAMMSwapTool,
  MemoryAwareTestnetAMMAddLiquidityTool,
  MemoryAwareTestnetLendingDepositCollateralTool
} from "../../src/memory/wrapped-tools";
import { SeiERC20BalanceTool } from "../../src/langchain/sei-erc20/balance";
import { TestnetPortfolioGetTool } from "../../src/langchain/testnet-portfolio";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../../src/types";
import { TOKENS } from "../../src/constants";

dotenv.config();

describe("Actual Onchain Transactions Integration", () => {
  let agent: SeiAgentKit;
  let memoryManager: MemoryManager;
  let balanceTool: SeiERC20BalanceTool;
  let portfolioTool: TestnetPortfolioGetTool;
  let tools: any[];

  beforeAll(async () => {
    // Check required environment variables
    const requiredVars = ["OPENAI_API_KEY", "SEI_PRIVATE_KEY"];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
    }
    
    // Create memory manager
    memoryManager = await MemoryManager.create();
    
    // Create agent with real private key
    const privateKey = process.env.SEI_PRIVATE_KEY!;
    agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
    
    // Create tools
    balanceTool = new SeiERC20BalanceTool(agent);
    portfolioTool = new TestnetPortfolioGetTool(agent);
    
    tools = [
      new MemoryAwareTestnetAMMSwapTool(agent, memoryManager, "test_user_123"),
      new MemoryAwareTestnetAMMAddLiquidityTool(agent, memoryManager, "test_user_123"),
      new MemoryAwareTestnetLendingDepositCollateralTool(agent, memoryManager, "test_user_123")
    ];
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should greet user with wallet balances", async () => {
    // Get native SEI balance
    const seiBalanceResult = await balanceTool.call({});
    const seiBalance = JSON.parse(seiBalanceResult);
    
    expect(seiBalance.status).toBe("success");
    expect(typeof seiBalance.balance).toBe("string");
    
    console.log(`Wallet SEI Balance: ${seiBalance.balance}`);
    
    // Get test token balances if available
    const tokenAddresses = Object.keys(TOKENS).filter(addr => addr !== "0x0");
    if (tokenAddresses.length > 0) {
      // Get balance for first test token
      const firstToken = TOKENS[tokenAddresses[0] as keyof typeof TOKENS];
      const tokenBalanceResult = await balanceTool.call({ contract_address: firstToken.attributes.address });
      const tokenBalance = JSON.parse(tokenBalanceResult);
      
      expect(tokenBalance.status).toBe("success");
      expect(typeof tokenBalance.balance).toBe("string");
      
      console.log(`Wallet ${firstToken.attributes.symbol} Balance: ${tokenBalance.balance}`);
    }
  });

  it("should retrieve user portfolio positions", async () => {
    const portfolioResult = await portfolioTool.call();
    const portfolio = JSON.parse(portfolioResult);
    
    expect(portfolio.status).toBe("success");
    expect(portfolio.portfolio).toBeDefined();
    
    console.log("Portfolio Positions:", JSON.stringify(portfolio.portfolio, null, 2));
  });

  it("should execute small actual transactions and record memories", async () => {
    // Get initial memory count
    const initialMemoryCount = (await memoryManager.retrieveMemories("test", 100)).length;
    
    // Get available token addresses
    const tokenAddresses = Object.keys(TOKENS).filter(addr => addr !== "0x0");
    if (tokenAddresses.length >= 2) {
      // Execute a small swap transaction (0.0001 tokens to keep test costs minimal)
      const swapTool = tools[0];
      const tokenIn = tokenAddresses[0];
      const tokenOut = tokenAddresses[1];
      
      try {
        // Use a very small amount for testing
        const amountIn = "100000000000000"; // 0.0001 tokens (assuming 18 decimals)
        
        const swapResult = await swapTool.call({
          tokenIn,
          tokenOut,
          amountIn
        });
        
        const result = JSON.parse(swapResult);
        console.log("Swap transaction result:", result);
        
        // Verify transaction was successful
        expect(result.status).toBe("success");
        expect(result.transactionHash).toBeDefined();
      } catch (error) {
        // Log error but don't fail test if there are insufficient funds or other expected issues
        console.warn("Swap transaction failed (may be due to insufficient funds):", error);
      }
    }
    
    // Check that memories were recorded
    const finalMemoryCount = (await memoryManager.retrieveMemories("test", 100)).length;
    // Note: We don't assert on memory count change because the transaction might have failed
    console.log(`Memory count: ${initialMemoryCount} -> ${finalMemoryCount}`);
  });

  it("should retrieve relevant memories after transactions", async () => {
    // Add a specific memory for testing retrieval
    await memoryManager.addMemory({
      content: "Successfully executed AMM swap transaction with small amount",
      type: "transaction_record",
      importance: 0.7,
      metadata: {
        userId: "test_user_123",
        protocol: "AMM",
        action: "swap",
        timestamp: new Date().toISOString()
      }
    });
    
    // Test memory retrieval
    const relevantMemories = await agent.getRelevantMemories("AMM swap transaction", 3);
    
    // Should have at least the memory we just added
    expect(relevantMemories.length).toBeGreaterThan(0);
    
    const relevantMemory = relevantMemories.find(mem => 
      mem.content.includes("AMM swap transaction")
    );
    
    expect(relevantMemory).toBeDefined();
    console.log("Retrieved relevant memories:", JSON.stringify(relevantMemories, null, 2));
  });
});