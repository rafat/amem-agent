import { MemoryManager } from "../../src/memory/manager";
import { Memory, MemoryType } from "../../src/memory/models";

// Mock the embedding generation to avoid dependency issues
jest.mock("../../src/memory/manager", () => {
  const actual = jest.requireActual("../../src/memory/manager");
  return {
    ...actual,
    MemoryManager: class MockMemoryManager extends actual.MemoryManager {
      private async generateEmbedding(text: string): Promise<number[]> {
        // Return a simple mock embedding
        return Array(1536).fill(0.1);
      }
    }
  };
});

describe("Cleanup Verification", () => {
  let memoryManager: MemoryManager;

  beforeAll(async () => {
    memoryManager = await MemoryManager.create();
  });

  afterAll(async () => {
    await memoryManager.close();
  });

  it("should create memory manager without errors", async () => {
    expect(memoryManager).toBeDefined();
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
});