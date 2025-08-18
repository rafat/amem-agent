import { v4 as uuidv4 } from "uuid";
import { Memory, MemoryType } from "./models";
import { getChromaClient } from "./chroma";
import { getNeo4jDriver, closeNeo4jDriver } from "./neo4j";
import { ChromaClient, CloudClient, Collection } from "chromadb";

export class MemoryManager {
  private chroma: ChromaClient | CloudClient;
  private neo4j: any;
  private collection!: Collection;

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
      this.collection = await this.chroma.getOrCreateCollection({
        name: "agent_memories",
      });
      console.log("Initialized ChromaDB collection:", this.collection.name);
    } catch (error) {
      console.error("Failed to initialize ChromaDB collection:", error);
      throw error;
    }
  }

  /**
   * Add a new memory to the system
   * @param memory The memory to add (without id and timestamp)
   * @returns The ID of the added memory
   */
  async addMemory(memory: Omit<Memory, "id" | "timestamp">): Promise<string> {
    // Generate ID and timestamp
    const id = uuidv4();
    const timestamp = new Date();

    // Create the full memory object with potentially enhanced importance scoring
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
        metadatas: [
          {
            type: newMemory.type,
            importance: newMemory.importance,
            timestamp: newMemory.timestamp.toISOString(),
            ...newMemory.metadata,
          },
        ],
        documents: [newMemory.content],
      });

      // Update the knowledge graph in Neo4j
      await this.updateGraph(newMemory);

      return id;
    } catch (error) {
      console.error("Failed to add memory:", error);
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
          // Check if content and metadata are not null
          const content = results.documents?.[0]?.[i] ?? "";
          const metadata = results.metadatas?.[0]?.[i] ?? {};

          memories.push({
            id: results.ids[0][i],
            content: content,
            type: (metadata.type as MemoryType) ?? "user_preference",
            timestamp: metadata.timestamp
              ? new Date(metadata.timestamp as string)
              : new Date(),
            importance:
              typeof metadata.importance === "number"
                ? metadata.importance
                : 0.5,
            metadata: metadata,
          });
        }
      }

      return memories;
    } catch (error) {
      console.error("Failed to retrieve memories:", error);
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
      // Handle transaction memories with protocol-specific relationships
      if (memory.type === "transaction_record") {
        const {
          userId,
          protocol,
          fromToken,
          toToken,
          hash,
          toolName,
          amount: _amount,
          liquidity: _liquidity,
          collateralToken,
          borrowToken,
        } = memory.metadata;

        // Use MERGE to avoid duplicates
        await session.run(
          `
          MERGE (u:User {id: $userId})
          MERGE (p:Protocol {name: $protocol})
          CREATE (tx:Transaction {hash: $hash, content: $content, timestamp: $timestamp, toolName: $toolName})
          MERGE (u)-[:EXECUTED]->(tx)
          MERGE (tx)-[:ON_PROTOCOL]->(p)
        `,
          {
            userId,
            protocol: protocol || "Unknown",
            hash: hash || "Unknown",
            toolName: toolName || "Unknown",
            content: memory.content,
            timestamp: memory.timestamp.toISOString(),
          },
        );

        // Add token relationships based on the specific protocol action
        if (toolName && toolName.includes("swap")) {
          await session.run(
            `
            MERGE (t_from:Token {address: $fromToken})
            MERGE (t_to:Token {address: $toToken})
            MATCH (tx:Transaction {hash: $hash})
            MERGE (tx)-[:SWAPPED_FROM]->(t_from)
            MERGE (tx)-[:SWAPPED_TO]->(t_to)
          `,
            {
              fromToken: fromToken || "Unknown",
              toToken: toToken || "Unknown",
              hash: hash || "Unknown",
            },
          );
        } else if (toolName && toolName.includes("liquidity")) {
          await session.run(
            `
            MERGE (t_a:Token {address: $tokenA})
            MERGE (t_b:Token {address: $tokenB})
            MATCH (tx:Transaction {hash: $hash})
            MERGE (tx)-[:INVOLVES_TOKEN]->(t_a)
            MERGE (tx)-[:INVOLVES_TOKEN]->(t_b)
          `,
            {
              tokenA: fromToken || "Unknown",
              tokenB: toToken || "Unknown",
              hash: hash || "Unknown",
            },
          );
        } else if (toolName && toolName.includes("lending")) {
          if (toolName.includes("deposit")) {
            await session.run(
              `
              MERGE (t:Token {address: $collateralToken})
              MATCH (tx:Transaction {hash: $hash})
              MERGE (tx)-[:DEPOSITED_COLLATERAL]->(t)
            `,
              {
                collateralToken: collateralToken || "Unknown",
                hash: hash || "Unknown",
              },
            );
          } else if (toolName.includes("borrow")) {
            await session.run(
              `
              MERGE (t:Token {address: $borrowToken})
              MATCH (tx:Transaction {hash: $hash})
              MERGE (tx)-[:BORROWED]->(t)
            `,
              {
                borrowToken: borrowToken || "Unknown",
                hash: hash || "Unknown",
              },
            );
          } else if (toolName.includes("repay")) {
            await session.run(
              `
              MERGE (t:Token {address: $borrowToken})
              MATCH (tx:Transaction {hash: $hash})
              MERGE (tx)-[:REPAID]->(t)
            `,
              {
                borrowToken: borrowToken || "Unknown",
                hash: hash || "Unknown",
              },
            );
          } else if (toolName.includes("withdraw")) {
            await session.run(
              `
              MERGE (t:Token {address: $collateralToken})
              MATCH (tx:Transaction {hash: $hash})
              MERGE (tx)-[:WITHDREW_COLLATERAL]->(t)
            `,
              {
                collateralToken: collateralToken || "Unknown",
                hash: hash || "Unknown",
              },
            );
          }
        } else if (toolName && toolName.includes("staking")) {
          await session.run(
            `
            MERGE (t:Token {address: $stakingToken})
            MATCH (tx:Transaction {hash: $hash})
            MERGE (tx)-[:STAKED_TOKEN]->(t)
          `,
            {
              stakingToken: fromToken || "Unknown",
              hash: hash || "Unknown",
            },
          );
        }
      }
      // Handle reflection/error memories
      else if (memory.type === "reflection") {
        const { userId, toolName, action } = memory.metadata;
        await session.run(
          `
          MERGE (u:User {id: $userId})
          MERGE (t:Tool {name: $toolName})
          CREATE (r:Reflection {content: $content, timestamp: $timestamp, action: $action})
          MERGE (u)-[:EXPERIENCED]->(r)
          MERGE (r)-[:RELATED_TO]->(t)
        `,
          {
            userId,
            toolName: toolName || "Unknown",
            action: action || "Unknown",
            content: memory.content,
            timestamp: memory.timestamp.toISOString(),
          },
        );
      }
      // Handle strategy outcome memories
      else if (memory.type === "strategy_outcome") {
        const { userId, strategy, outcome, profitability } = memory.metadata;
        await session.run(
          `
          MERGE (u:User {id: $userId})
          MERGE (s:Strategy {name: $strategy})
          CREATE (so:StrategyOutcome {content: $content, timestamp: $timestamp, outcome: $outcome, profitability: $profitability})
          MERGE (u)-[:EXECUTED_STRATEGY]->(s)
          MERGE (s)-[:HAD_OUTCOME]->(so)
        `,
          {
            userId,
            strategy: strategy || "Unknown",
            outcome: outcome || "Unknown",
            profitability: profitability || 0,
            content: memory.content,
            timestamp: memory.timestamp.toISOString(),
          },
        );
      }
      // Handle market observation memories
      else if (memory.type === "market_observation") {
        const { userId, token, price, trend } = memory.metadata;
        await session.run(
          `
          MERGE (u:User {id: $userId})
          MERGE (t:Token {address: $token})
          CREATE (mo:MarketObservation {content: $content, timestamp: $timestamp, price: $price, trend: $trend})
          MERGE (u)-[:OBSERVED]->(mo)
          MERGE (mo)-[:FOR_TOKEN]->(t)
        `,
          {
            userId,
            token: token || "Unknown",
            price: price || 0,
            trend: trend || "Unknown",
            content: memory.content,
            timestamp: memory.timestamp.toISOString(),
          },
        );
      }
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
      const { OpenAIEmbeddings } = await import("@langchain/openai");

      // Check if API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }

      // Initialize OpenAI embeddings client
      const embeddings = new OpenAIEmbeddings({
        apiKey: apiKey,
        model: "text-embedding-ada-002",
      });

      // Generate embedding
      const embedding = await embeddings.embedQuery(text);

      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await closeNeo4jDriver();
  }
}
