import { MemoryManager } from '../src/memory/manager';
import { MemoryType } from '../src/memory/models';

async function testMemoryManager() {
  console.log('Testing Memory Manager...');
  
  try {
    console.log('Creating MemoryManager...');
    const memoryManager = await MemoryManager.create();
    console.log('MemoryManager created successfully');
    
    // Add a test memory
    console.log('Adding test memory...');
    const memoryId = await memoryManager.addMemory({
      content: 'Successfully swapped 100 USDC for 0.1 ETH on Testnet AMM.',
      type: 'transaction_record' as MemoryType,
      importance: 0.8,
      metadata: {
        userId: 'test_user_123',
        protocol: 'Testnet AMM',
        fromToken: 'USDC',
        toToken: 'ETH',
        hash: '0x123456789abcdef',
      },
    });
    
    console.log('Added memory with ID:', memoryId);
    
    // Retrieve memories
    console.log('Retrieving memories...');
    const memories = await memoryManager.retrieveMemories('token swap', 5);
    console.log('Retrieved memories:', memories);
    
    console.log('Closing MemoryManager...');
    await memoryManager.close();
    console.log('Memory Manager test completed successfully!');
  } catch (error) {
    console.error('Memory Manager test failed:', error);
  }
}

testMemoryManager();