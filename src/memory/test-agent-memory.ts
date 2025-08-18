import { SeiAgentKit } from "../agent";
import { MemoryManager } from "../memory/manager";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../types";

dotenv.config();

async function testMemoryAwareAgent() {
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
    
    // Test getting relevant memories
    console.log("Testing memory retrieval...");
    const memories = await agent.getRelevantMemories("swap tokens", 3);
    console.log("Retrieved memories:", memories.length);
    
    // Test scoring memories
    console.log("Testing memory scoring...");
    const scoredMemories = await agent.getScoredMemories("swap tokens", 3);
    console.log("Scored memories:", scoredMemories.length);
    scoredMemories.forEach((item, index) => {
      console.log(`${index + 1}. Score: ${item.score.toFixed(3)} - ${item.memory.content}`);
    });
    
    // Test creating memory-aware prompt
    console.log("Testing memory-aware prompt creation...");
    const basePrompt = "You are an AI assistant helping with DeFi operations.";
    const enhancedPrompt = await agent.createMemoryAwarePrompt(basePrompt, "swap tokens", 500);
    console.log("Enhanced prompt length:", enhancedPrompt.length);
    console.log("Enhanced prompt preview:", enhancedPrompt.substring(0, 200) + "...");
    
    // Close memory manager
    await memoryManager.close();
    
    console.log("Memory-aware agent tests completed successfully!");
  } catch (error) {
    console.error("Error testing memory-aware agent:", error);
  }
}

// Run the test
testMemoryAwareAgent().catch(console.error);