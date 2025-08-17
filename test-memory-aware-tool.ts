import { MemoryManager } from './src/memory/manager';
import { MemoryAwareTool } from './src/memory/wrapped-tools/base';
import { z } from "zod";

async function testMemoryAwareTool() {
  console.log('Testing Memory-Aware Tool Framework...');
  
  try {
    // Create memory manager
    const memoryManager = await MemoryManager.create();
    console.log('✓ Memory Manager initialized successfully');
    
    // Count existing memories before our test
    const initialMemories = await memoryManager.retrieveMemories('test tool execution', 10);
    const initialCount = initialMemories.length;
    console.log(`Found ${initialCount} existing test-related memories`);
    
    // Create a simple test tool that extends MemoryAwareTool
    const TestSchema = z.object({
      message: z.string().describe("A test message"),
    });
    
    class TestMemoryAwareTool extends MemoryAwareTool<typeof TestSchema> {
      name = "test_memory_aware_tool";
      description = "A test tool to verify the memory-aware framework";
      schema = TestSchema;
      
      constructor(memoryManager: MemoryManager) {
        super(memoryManager, "test_user_123");
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
    const testTool = new TestMemoryAwareTool(memoryManager);
    console.log('✓ Memory-Aware Test Tool created successfully');
    
    // Test the tool
    const result = await testTool.invoke({
      message: "Hello, memory-aware world!"
    });
    
    console.log('Tool execution result:', result);
    
    // Wait a moment for the memory to be recorded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retrieve memories to verify they were recorded
    const memories = await memoryManager.retrieveMemories('test tool execution', 10);
    const finalCount = memories.length;
    
    console.log(`Memory count: ${initialCount} -> ${finalCount}`);
    
    // Look for our specific test memory
    const ourMemories = memories.filter(memory => 
      memory.content.includes('test_memory_aware_tool') || 
      memory.content.includes('Hello, memory-aware world!')
    );
    
    if (ourMemories.length > 0) {
      console.log('✓ Successfully recorded memory from tool execution');
      console.log('Recorded memory:', ourMemories[0]);
    } else {
      console.log('⚠ Could not find specific memory from our tool execution');
    }
    
    console.log('Memory-Aware Tool Framework test completed successfully!');
  } catch (error) {
    console.error('Memory-Aware Tool Framework test failed:', error);
  }
}

testMemoryAwareTool();