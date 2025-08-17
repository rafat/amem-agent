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

async function testMemoryAwareToolErrorHandling() {
  console.log('Testing Memory-Aware Tool Error Handling...');
  
  try {
    // Create mock memory manager
    const mockMemoryManager = new MockMemoryManager();
    
    // Create a test tool that simulates an error
    const TestSchema = z.object({
      shouldFail: z.boolean().describe("Whether the tool should fail"),
    });
    
    class TestErrorMemoryAwareTool extends MemoryAwareTool<typeof TestSchema> {
      name = "test_error_tool";
      description = "A test tool to verify error handling";
      schema = TestSchema;
      
      constructor() {
        // Pass mock memory manager and user ID
        super(mockMemoryManager as any, "test_user_123");
      }
      
      protected async _callRaw(input: z.infer<typeof TestSchema>): Promise<any> {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (input.shouldFail) {
          throw new Error("Simulated tool failure");
        }
        
        // Return a successful result
        return {
          status: "success",
          message: "Tool executed successfully",
        };
      }
    }
    
    // Create test tool
    const testTool = new TestErrorMemoryAwareTool();
    console.log('✓ Error Handling Test Tool created successfully');
    
    // Test successful execution
    console.log('\n--- Testing successful execution ---');
    const successResult = await testTool.invoke({
      shouldFail: false
    });
    
    console.log('Success result:', successResult);
    
    // Test error handling
    console.log('\n--- Testing error handling ---');
    try {
      const errorResult = await testTool.invoke({
        shouldFail: true
      });
      console.log('Error result:', errorResult);
    } catch (error) {
      console.log('Tool threw error as expected:', error);
    }
    
    // Check memories
    console.log(`\nMock memory manager has ${mockMemoryManager.memories.length} memories`);
    
    mockMemoryManager.memories.forEach((memory, index) => {
      console.log(`Memory ${index + 1}:`, {
        content: memory.content,
        type: memory.type,
        importance: memory.importance
      });
    });
    
    console.log('Memory-Aware Tool Error Handling test completed successfully!');
  } catch (error) {
    console.error('Memory-Aware Tool Error Handling test failed:', error);
  }
}

testMemoryAwareToolErrorHandling();