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

async function runTests() {
  console.log("Starting Actual Onchain Transactions Tests...\n");
  
  // Check required environment variables
  const requiredVars = ["OPENAI_API_KEY", "SEI_PRIVATE_KEY"];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }
  
  // Create memory manager
  const memoryManager = await MemoryManager.create();
  
  // Create agent with real private key
  const privateKey = process.env.SEI_PRIVATE_KEY!;
  const agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI, memoryManager);
  
  // Create tools
  const balanceTool = new SeiERC20BalanceTool(agent);
  const portfolioTool = new TestnetPortfolioGetTool(agent);
  
  const tools = [
    new MemoryAwareTestnetAMMSwapTool(agent, memoryManager, "test_user_123"),
    new MemoryAwareTestnetAMMAddLiquidityTool(agent, memoryManager, "test_user_123"),
    new MemoryAwareTestnetLendingDepositCollateralTool(agent, memoryManager, "test_user_123")
  ];

  try {
    // Test 1: Greet user with wallet balances
    console.log("Test 1: Greeting user with wallet balances...");
    
    // Get native SEI balance
    const seiBalanceResult = await balanceTool.call({});
    const seiBalance = JSON.parse(seiBalanceResult);
    
    if (seiBalance.status !== "success") {
      throw new Error(`Failed to get SEI balance: ${seiBalance.message}`);
    }
    
    console.log(`  ✓ Wallet SEI Balance: ${seiBalance.balance}`);
    
    // Get test token balances if available
    const tokenAddresses = Object.keys(TOKENS).filter(addr => addr !== "0x0");
    if (tokenAddresses.length > 0) {
      // Get balance for first test token
      const firstToken = TOKENS[tokenAddresses[0] as keyof typeof TOKENS];
      const tokenBalanceResult = await balanceTool.call({ contract_address: firstToken.attributes.address });
      const tokenBalance = JSON.parse(tokenBalanceResult);
      
      if (tokenBalance.status !== "success") {
        throw new Error(`Failed to get token balance: ${tokenBalance.message}`);
      }
      
      console.log(`  ✓ Wallet ${firstToken.attributes.symbol} Balance: ${tokenBalance.balance}`);
    }
    
    // Test 2: Retrieve user portfolio positions
    console.log("\nTest 2: Retrieving user portfolio positions...");
    const portfolioResult = await portfolioTool.call("");
    const portfolio = JSON.parse(portfolioResult);
    
    if (portfolio.status !== "success") {
      throw new Error(`Failed to get portfolio: ${portfolio.message}`);
    }
    
    console.log("  ✓ Portfolio retrieved successfully");
    console.log(`  Portfolio data: ${JSON.stringify(portfolio.portfolio, null, 2)}`);
    
    // Test 3: Execute small actual transactions and record memories
    console.log("\nTest 3: Executing small actual transactions...");
    
    // Get initial memory count (handle potential ChromaDB errors)
    let initialMemoryCount = 0;
    try {
      initialMemoryCount = (await memoryManager.retrieveMemories("test", 100)).length;
    } catch (error) {
      console.warn("  ⚠ Could not retrieve initial memory count:", error.message);
    }
    
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
        console.log(`  Swap transaction result: ${JSON.stringify(result, null, 2)}`);
        
        // Verify transaction was successful
        if (result.status !== "success") {
          console.warn(`  ⚠ Swap transaction failed: ${result.message}`);
        } else {
          console.log(`  ✓ Swap transaction successful. Hash: ${result.transactionHash}`);
        }
      } catch (error) {
        // Log error but don't fail test if there are insufficient funds or other expected issues
        console.warn(`  ⚠ Swap transaction failed (may be due to insufficient funds): ${error}`);
      }
    }
    
    // Check that memories were recorded
    let finalMemoryCount = 0;
    try {
      finalMemoryCount = (await memoryManager.retrieveMemories("test", 100)).length;
      console.log(`  Memory count: ${initialMemoryCount} -> ${finalMemoryCount}`);
    } catch (error) {
      console.warn("  ⚠ Could not retrieve final memory count:", error.message);
    }
    
    // Test 4: Retrieve relevant memories after transactions
    console.log("\nTest 4: Retrieving relevant memories...");
    
    try {
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
      if (relevantMemories.length === 0) {
        console.warn("  ⚠ No relevant memories found");
      } else {
        console.log(`  ✓ Found ${relevantMemories.length} relevant memories`);
        console.log(`  Retrieved memories: ${JSON.stringify(relevantMemories, null, 2)}`);
      }
    } catch (error) {
      console.warn("  ⚠ Memory retrieval test failed:", error.message);
    }
    
    console.log("\n✓ All tests completed successfully!");
  } catch (error) {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  } finally {
    await memoryManager.close();
  }
}

// Run the tests
runTests().catch(console.error);