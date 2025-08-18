import { MemoryManager } from "../../src/memory/manager";
import { Memory, MemoryType } from "../../src/memory/models";

describe("Memory Manager", () => {
  let memoryManager: MemoryManager;

  beforeAll(async () => {
    memoryManager = await MemoryManager.create();
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should add and retrieve memories", async () => {
    const testMemory = {
      content: "Test memory for unit testing",
      type: "user_preference" as MemoryType,
      importance: 0.5,
      metadata: {
        test: true,
        userId: "test-user-123"
      }
    };

    const memoryId = await memoryManager.addMemory(testMemory);
    expect(memoryId).toBeDefined();
    expect(typeof memoryId).toBe("string");

    const retrievedMemories = await memoryManager.retrieveMemories("test memory", 5);
    expect(retrievedMemories.length).toBeGreaterThan(0);

    const testMemoryFound = retrievedMemories.find(mem => mem.id === memoryId);
    expect(testMemoryFound).toBeDefined();
    expect(testMemoryFound?.content).toBe(testMemory.content);
    expect(testMemoryFound?.type).toBe(testMemory.type);
    expect(testMemoryFound?.importance).toBe(testMemory.importance);
  });

  it("should calculate temporal weights correctly", () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000); // 1 day ago
    const oneWeekAgo = new Date(now.getTime() - 604800000); // 1 week ago
    
    const recentWeight = memoryManager.calculateTemporalWeight(oneDayAgo);
    const olderWeight = memoryManager.calculateTemporalWeight(oneWeekAgo);
    
    expect(recentWeight).toBeGreaterThan(olderWeight);
    expect(recentWeight).toBeGreaterThanOrEqual(0);
    expect(recentWeight).toBeLessThanOrEqual(1);
    expect(olderWeight).toBeGreaterThanOrEqual(0);
    expect(olderWeight).toBeLessThanOrEqual(1);
  });

  it("should retrieve memories with scores", async () => {
    const testMemory = {
      content: "Another test memory for scoring",
      type: "transaction_record" as MemoryType,
      importance: 0.8,
      metadata: {
        userId: "test-user-123",
        protocol: "AMM",
        action: "swap"
      }
    };

    await memoryManager.addMemory(testMemory);

    const scoredMemories = await memoryManager.retrieveMemoriesWithScores("swap tokens", 5);
    expect(scoredMemories.length).toBeGreaterThan(0);
    
    // Check that all items have scores
    scoredMemories.forEach(item => {
      expect(item.score).toBeDefined();
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(1);
    });
  });
});