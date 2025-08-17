import { v4 as uuidv4 } from 'uuid';
import { Memory, MemoryType } from './models';

// Use real implementations
import { getChromaClient } from './chroma';
import { getNeo4jDriver } from './neo4j';

export class MemoryManager {
  private chroma: any;
  private neo4j: any;
  private collection: any;

  private constructor() {
    this.chroma = getChromaClient();
    this.neo4j = getNeo4jDriver();
  }

  static async create(): Promise<MemoryManager> {
    const manager = new MemoryManager();
    await manager.initializeCollection();
    return manager;
  }

  private async initializeCollection() {
    try {
      // For Chroma Cloud, we need to get or create the collection differently
      this.collection = await this.chroma.getOrCreateCollection({ name: 'agent_memories' });
    } catch (error) {
      console.error('Failed to initialize ChromaDB collection:', error);
      throw error;
    }
  }

  /**
   * Add a new memory to the system
   * @param memory The memory to add (without id and timestamp)
   * @returns The ID of the added memory
   */
  async addMemory(memory: Omit<Memory, 'id' | 'timestamp'>): Promise<string> {
    // Generate ID and timestamp
    const id = uuidv4();
    const timestamp = new Date();

    // Create the full memory object
    const newMemory: Memory = {
      ...memory,
      id,
      timestamp,
    };

    try {
      // Generate embedding for the memory content
      const embedding = await this.generateEmbedding(newMemory.content);

      // Store in ChromaDB for semantic search
      await this.collection.add({
        ids: [newMemory.id],
        embeddings: [embedding],
        metadatas: [{ 
          type: newMemory.type, 
          importance: newMemory.importance,
          timestamp: newMemory.timestamp.toISOString(),
          ...newMemory.metadata
        }],
        documents: [newMemory.content],
      });

      // Update the knowledge graph in Neo4j
      await this.updateGraph(newMemory);

      return id;
    } catch (error) {
      console.error('Failed to add memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve memories based on a query
   * @param queryText The text to search for
   * @param k The number of memories to retrieve
   * @returns Array of matching memories
   */
  async retrieveMemories(queryText: string, k: number = 5): Promise<Memory[]> {
    try {
      // Generate embedding for the query text
      const queryEmbedding = await this.generateEmbedding(queryText);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: k,
      });

      // Format results back into Memory objects
      const memories: Memory[] = [];
      if (results && results.ids && results.ids.length > 0) {
        for (let i = 0; i < results.ids[0].length; i++) {
          memories.push({
            id: results.ids[0][i],
            content: results.documents[0][i],
            type: results.metadatas[0][i].type,
            timestamp: new Date(results.metadatas[0][i].timestamp),
            importance: results.metadatas[0][i].importance,
            metadata: results.metadatas[0][i],
          });
        }
      }

      return memories;
    } catch (error) {
      console.error('Failed to retrieve memories:', error);
      throw error;
    }
  }

  /**
   * Update the knowledge graph in Neo4j based on a memory
   * @param memory The memory to use for updating the graph
   */
  private async updateGraph(memory: Memory): Promise<void> {
    const session = this.neo4j.session();
    try {
      // Example: If memory is a transaction, link user, protocol, and tokens
      if (memory.type === 'transaction_record') {
        const { userId, protocol, fromToken, toToken, hash } = memory.metadata;
        // Use MERGE to avoid duplicates
        await session.run(`
          MERGE (u:User {id: $userId})
          MERGE (p:Protocol {name: $protocol})
          MERGE (t_from:Token {symbol: $fromToken})
          MERGE (t_to:Token {symbol: $toToken})
          CREATE (tx:Transaction {hash: $hash, content: $content, timestamp: $timestamp})
          MERGE (u)-[:EXECUTED]->(tx)
          MERGE (tx)-[:ON_PROTOCOL]->(p)
          MERGE (tx)-[:SWAPPED_FROM]->(t_from)
          MERGE (tx)-[:SWAPPED_TO]->(t_to)
        `, { 
          userId, 
          protocol, 
          fromToken, 
          toToken, 
          hash,
          content: memory.content, 
          timestamp: memory.timestamp.toISOString() 
        });
      }
      // Add more logic for other memory types
    } finally {
      await session.close();
    }
  }

  /**
   * Generate an embedding for a text string using OpenAI
   * @param text The text to embed
   * @returns The embedding vector
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Import OpenAIEmbeddings from LangChain
      const { OpenAIEmbeddings } = await import('@langchain/openai');
      
      // Check if API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      
      // Initialize OpenAI embeddings client
      const embeddings = new OpenAIEmbeddings({
        apiKey: apiKey,
        model: 'text-embedding-ada-002',
      });
      
      // Generate embedding
      const embedding = await embeddings.embedQuery(text);
      
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
}