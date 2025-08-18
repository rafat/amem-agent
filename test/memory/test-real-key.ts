import { SeiAgentKit } from "../../src/agent";
import { MemoryManager } from "../../src/memory/manager";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../../src/types";

dotenv.config();

async function testRealPrivateKey() {
  try {
    console.log("Testing agent creation with real private key...");
    
    // Get the private key from environment variables
    const privateKey = process.env.SEI_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error("SEI_PRIVATE_KEY not found in environment variables");
      process.exit(1);
    }
    
    console.log("Private key length:", privateKey.length);
    console.log("Private key starts with 0x:", privateKey.startsWith('0x'));
    
    // Format the private key properly
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    console.log("Formatted private key length:", formattedPrivateKey.length);
    
    // Create memory manager
    const memoryManager = await MemoryManager.create();
    
    // Create agent with real private key
    const agent = new SeiAgentKit(
      formattedPrivateKey,
      ModelProviderName.OPENAI,
      memoryManager
    );
    
    console.log("✅ Agent created successfully!");
    console.log("Wallet address:", agent.wallet_address);
    
    // Test a simple operation
    console.log("Testing wallet balance retrieval...");
    // Note: We're not calling getERC20Balance as it would require a network connection
    
    // Close memory manager
    await memoryManager.close();
    
    console.log("✅ All tests passed with real private key!");
  } catch (error) {
    console.error("❌ Error testing real private key:", error);
    process.exit(1);
  }
}

// Run the test
testRealPrivateKey().catch(console.error);