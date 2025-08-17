import { MemoryAwareTool } from './src/memory/wrapped-tools/base';
import { z } from "zod";

// Mock memory manager for testing
class MockMemoryManager {
  memories: any[] = [];
  
  async addMemory(memory: any) {
    this.memories.push({
      ...memory,
      id: `mock-id-${this.memories.length + 1}`,
      timestamp: new Date()
    });
    console.log(`Mock memory recorded: ${memory.content}`);
  }
  
  async retrieveMemories(query: string, k: number = 5) {
    // Simple filter based on query
    return this.memories.filter(m => m.content.toLowerCase().includes(query.toLowerCase())).slice(0, k);
  }
}

async function testMemoryAwareToolLogic() {
  console.log('Testing Memory-Aware Tool Logic...');
  
  try {
    // Create mock memory manager
    const mockMemoryManager = new MockMemoryManager();
    
    // Create a simple test tool that extends MemoryAwareTool
    const TestSchema = z.object({
      message: z.string().describe("A test message"),
    });
    
    class TestMemoryAwareTool extends MemoryAwareTool<typeof TestSchema> {
      name = "test_memory_aware_tool";
      description = "A test tool to verify the memory-aware framework";
      schema = TestSchema;
      
      constructor() {
        // Pass mock memory manager and user ID
        super(mockMemoryManager as any, "test_user_123");
      }
      
      protected async _callRaw(input: z.infer<typeof TestSchema>): Promise<any> {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Return a successful result
        return {
          status: "success",
          message: `Processed: ${input.message}`,
        };
      }
    }
    
    // Create test tool
    const testTool = new TestMemoryAwareTool();
    console.log('✓ Memory-Aware Test Tool created successfully');
    
    // Test the tool
    const result = await testTool.invoke({
      message: "Hello, memory-aware world!"
    });
    
    console.log('Tool execution result:', result);
    
    // Check if memory was recorded
    console.log(`Mock memory manager has ${mockMemoryManager.memories.length} memories`);
    
    if (mockMemoryManager.memories.length > 0) {
      console.log('✓ Successfully recorded memory from tool execution');
      console.log('Recorded memory:', mockMemoryManager.memories[0]);
    } else {
      console.log('⚠ Failed to record memory from tool execution');
    }
    
    console.log('Memory-Aware Tool Logic test completed successfully!');
  } catch (error) {
    console.error('Memory-Aware Tool Logic test failed:', error);
  }
}

testMemoryAwareToolLogic();