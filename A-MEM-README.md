# A-MEM: Autonomous Memory System for Cambrian Agents

This document explains how to use the A-MEM system that has been integrated into the Cambrian Agent Kit.

## System Architecture

The A-MEM system consists of three main components:

1. **Memory Manager**: The core component that handles storing and retrieving memories
2. **Database Connectors**: Interfaces to Neo4j (graph database), ChromaDB (vector database), and Supabase (relational database)
3. **Intelligence Engine**: A background service that runs scheduled tasks to reflect on memories and generate insights

## Setting Up the System

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your database credentials
2. **Docker Services**: Run `docker-compose up -d` to start the Neo4j and ChromaDB services
3. **Dependencies**: Run `pnpm install` to install all required dependencies

## Using the Memory System

### Creating a Memory Manager

```typescript
import { MemoryManager } from './src/memory/manager';

const memoryManager = await MemoryManager.create();
```

### Adding Memories

```typescript
const memoryId = await memoryManager.addMemory({
  content: 'Successfully swapped 100 USDC for 0.1 ETH on Testnet AMM.',
  type: 'transaction_record',
  importance: 0.8,
  metadata: {
    userId: 'user_123',
    protocol: 'Testnet AMM',
    fromToken: 'USDC',
    toToken: 'ETH',
    hash: '0x123456789abcdef',
  },
});
```

### Retrieving Memories

```typescript
const memories = await memoryManager.retrieveMemories('token swap', 5);
```

## Memory-Enabled Tools

The system can be extended with memory-enabled versions of testnet tools that automatically record actions as memories.

## Intelligence Engine

The intelligence engine runs scheduled tasks to reflect on memories:

```bash
cd intelligence-engine
npm start
```

By default, it runs a nightly reflection at 2 AM that:
1. Retrieves recent, important memories
2. Generates insights using an LLM
3. Saves reflections as high-importance memories

## Retrieval Augmented Generation (RAG)

The system includes a RAG implementation that retrieves relevant memories and includes them in the agent's prompt:

```typescript
const ragChain = RunnableSequence.from([
  {
    input: new RunnablePassthrough(),
    memory: async (input: { input: string }) => {
      const memoryManager = await MemoryManager.create();
      const memories = await memoryManager.retrieveMemories(input.input);
      return memories.map(m => `[${m.type}]: ${m.content}`).join('\n');
    },
  },
  promptTemplate,
  llm,
]);
```

## Testing

Several test scripts are included:

- `pnpm test-memory`: Tests the memory manager with mock databases
- `pnpm test-memory-agent`: Tests an agent with memory-enabled tools
- `pnpm test-rag-agent`: Tests an agent with RAG capabilities

## Future Enhancements

1. **Embedding Generation**: Implement actual embedding generation using OpenAI's text-embedding-ada-002 or local models
2. **Memory Importance Calculation**: Develop algorithms to automatically calculate memory importance
3. **Advanced Graph Queries**: Implement more complex graph queries for relationship discovery
4. **Memory Consolidation**: Add mechanisms to consolidate and summarize memories over time
5. **Multi-user Support**: Extend the system to handle multiple users with isolated memory stores