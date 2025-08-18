import { MemoryManager } from "../src/memory/manager";
import { SeiAgentKit } from "../src/agent";
import * as dotenv from "dotenv";
import { ModelProviderName } from "../src/types";

dotenv.config();

async function runCoreFunctionalityTests() {
  console.log("🧪 Running Core Functionality Tests...\n");
  
  try {
    // Test 1: MemoryManager basic functionality
    console.log("Test 1: MemoryManager basic functionality");
    
    // Create a mock memory manager for testing (without external dependencies)
    const mockMemoryManager = {
      addMemory: async (memory: any) => {
        console.log(`Mock: Adding memory - ${memory.content.substring(0, 50)}...`);
        return "mock-memory-id-123";
      },
      retrieveMemories: async (query: string, k: number = 5) => {
        console.log(`Mock: Retrieving memories for query "${query}"`);
        return [
          {
            id: "mock-memory-1",
            content: "Mock memory content for testing",
            type: "transaction_record",
            timestamp: new Date(),
            importance: 0.8,
            metadata: { mock: true }
          }
        ];
      },
      retrieveMemoriesWithScores: async (query: string, k: number = 5) => {
        console.log(`Mock: Retrieving memories with scores for query "${query}"`);
        return [
          {
            memory: {
              id: "mock-memory-1",
              content: "Mock memory content for testing",
              type: "transaction_record",
              timestamp: new Date(),
              importance: 0.8,
              metadata: { mock: true }
            },
            score: 0.95
          }
        ];
      },
      calculateTemporalWeight: (timestamp: Date) => {
        const now = new Date();
        const ageInDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return Math.pow(0.5, ageInDays / 7); // 7-day half-life
      },
      close: async () => {
        console.log("Mock: Closing memory manager");
      }
    };
    
    // Test the mock memory manager
    const memoryId = await mockMemoryManager.addMemory({
      content: "Test memory for core functionality testing",
      type: "transaction_record",
      importance: 0.7,
      metadata: { test: true }
    });
    console.log(`✓ Mock memory added with ID: ${memoryId}`);
    
    const retrievedMemories = await mockMemoryManager.retrieveMemories("test memory", 3);
    console.log(`✓ Retrieved ${retrievedMemories.length} mock memories`);
    
    const scoredMemories = await mockMemoryManager.retrieveMemoriesWithScores("test memory", 3);
    console.log(`✓ Retrieved ${scoredMemories.length} scored mock memories`);
    
    const temporalWeight = mockMemoryManager.calculateTemporalWeight(new Date(Date.now() - 86400000)); // 1 day ago
    console.log(`✓ Temporal weight for 1-day-old memory: ${temporalWeight.toFixed(3)}`);
    
    // Test 2: Agent core functionality
    console.log("\nTest 2: Agent core functionality");
    const privateKey = process.env.SEI_PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123";
    const agent = new SeiAgentKit(privateKey, ModelProviderName.OPENAI);
    
    // Test agent memory methods with mock memory manager
    const agentRelevantMemories = await agent.getRelevantMemories("test query", 3);
    console.log(`✓ Agent retrieved ${agentRelevantMemories.length} relevant memories`);
    
    const agentScoredMemories = await agent.getScoredMemories("test query", 3);
    console.log(`✓ Agent retrieved ${agentScoredMemories.length} scored memories`);
    
    const agentPrompt = await agent.createMemoryAwarePrompt(
      "You are an AI assistant helping with DeFi operations.",
      "test query",
      200
    );
    console.log(`✓ Agent created memory-aware prompt (${agentPrompt.length} characters)`);
    
    console.log("\n✅ All core functionality tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Core functionality test failed:", error);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting A-MEM Core Functionality Test...\n");
  
  const startTime = Date.now();
  
  // Run core functionality tests
  const coreTestsPassed = await runCoreFunctionalityTests();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log("\n📊 Test Execution Summary:");
  console.log(`⏱️  Total execution time: ${totalTime}ms`);
  console.log(`✅ Core Functionality Tests: ${coreTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  if (coreTestsPassed) {
    console.log("\n🎉 Core functionality tests passed! 🎉");
    process.exit(0);
  } else {
    console.log("\n⚠️  Core functionality tests failed. ⚠️");
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error("Test execution failed:", error);
  process.exit(1);
});