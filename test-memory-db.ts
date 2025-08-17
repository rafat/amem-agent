import { MemoryManager } from './src/memory/manager';
import { MemoryType } from './src/memory/models';

async function testMemorySystem() {
  let memoryManager: MemoryManager | null = null;
  
  console.log('Testing Memory System with Real Databases...');
  
  try {
    // Create memory manager
    memoryManager = await MemoryManager.create();
    console.log('✓ Memory Manager initialized successfully');
    
    // Add a test memory
    const memoryId = await memoryManager.addMemory({
      content: 'Successfully swapped 100 USDC for 0.1 ETH on Symphony.',
      type: 'transaction_record' as MemoryType,
      importance: 0.8,
      metadata: {
        userId: 'test_user_123',
        protocol: 'Symphony',
        fromToken: 'USDC',
        toToken: 'ETH',
        hash: '0x123456789abcdef',
      },
    });
    
    console.log('✓ Added memory with ID:', memoryId);
    
    // Retrieve memories
    const memories = await memoryManager.retrieveMemories('token swap', 5);
    console.log('✓ Retrieved memories:', memories.length);
    
    console.log('Memory System test completed successfully!');
  } catch (error) {
    console.error('Memory System test failed:', error);
  } finally {
    // Close database connections
    if (memoryManager) {
      await memoryManager.close();
      console.log('✓ Database connections closed');
    }
    process.exit(0);
  }
}

testMemorySystem();