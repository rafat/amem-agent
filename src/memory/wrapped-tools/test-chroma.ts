import { MemoryManager } from "../manager";
import { MemoryType } from "../models";

async function testChromaDB() {
  // Initialize memory manager
  const memoryManager = await MemoryManager.create();

  try {
    // Test adding a simple memory
    const memoryId = await memoryManager.addMemory({
      content: "Test memory for ChromaDB connectivity",
      type: "user_preference" as MemoryType,
      importance: 0.5,
      metadata: {
        userId: "test-user-123",
        test: true,
      },
    });

    console.log("Successfully added memory with ID:", memoryId);

    // Test retrieving memories
    const memories = await memoryManager.retrieveMemories("test memory", 5);
    console.log("Retrieved memories:", memories);
  } catch (error) {
    console.error("Error testing ChromaDB:", error);
  } finally {
    // Close memory manager
    await memoryManager.close();
  }
}

// Run the test
testChromaDB().catch(console.error);
