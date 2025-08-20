// Mock implementations for testing without Docker

// Mock ChromaClient
class MockChromaCollection {
  private documents: any[] = [];
  private ids: any[] = [];
  private metadatas: any[] = [];
  private embeddings: any[] = [];

  async add(data: { ids: string[], embeddings: number[][], metadatas: any[], documents: string[] }) {
    this.ids.push(...data.ids);
    this.embeddings.push(...data.embeddings);
    this.metadatas.push(...data.metadatas);
    this.documents.push(...data.documents);
    return { status: 'success' };
  }

  async query(data: { queryEmbeddings: number[][], nResults: number }) {
    // Simple mock that returns the first nResults items
    const n = Math.min(data.nResults, this.documents.length);
    return {
      ids: [this.ids.slice(0, n)],
      documents: [this.documents.slice(0, n)],
      metadatas: [this.metadatas.slice(0, n)],
      embeddings: [this.embeddings.slice(0, n)],
    };
  }
}

class MockChromaClient {
  private collections: Map<string, MockChromaCollection> = new Map();

  async getOrCreateCollection({ name }: { name: string }) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockChromaCollection());
    }
    return this.collections.get(name)!;
  }
}

// Mock Neo4j Driver
class MockNeo4jSession {
  async run(query: string, params: any) {
    console.log('Mock Neo4j query executed:', query, params);
    return { records: [] };
  }

  async close() {
    // No-op
  }
}

class MockNeo4jDriver {
  session() {
    return new MockNeo4jSession();
  }

  async close() {
    // No-op
  }
}

// Export mock implementations
export function getChromaClient(): any {
  return new MockChromaClient();
}

export function getNeo4jDriver(): any {
  return new MockNeo4jDriver();
}

