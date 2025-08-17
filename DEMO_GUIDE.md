# A-MEM Agent Kit Demo Guide

This guide explains how to demonstrate the A-MEM (Advanced Memory) Agent Kit with real databases.

## Demo Overview

The A-MEM Agent Kit enhances the SEI Agent Kit with advanced memory capabilities:
- Persistent semantic memory using ChromaDB
- Knowledge graph relationships using Neo4j
- Structured data storage using Supabase
- Real OpenAI embeddings for semantic search

## Quick Demo Setup (Cloud Deployment)

For the fastest demo experience, use cloud services:

### 1. Prerequisites
- Node.js 18+
- Git
- OpenAI API key
- SEI testnet wallet

### 2. Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd amem-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Sign up for cloud services**:
   - ChromaDB Cloud: https://www.trychroma.com/
   - Neo4j AuraDB: https://neo4j.com/cloud/
   - Supabase Cloud: https://supabase.com/

5. **Update .env with cloud credentials**:
   ```env
   # ChromaDB Cloud
   CHROMA_URL=your_chroma_cloud_endpoint
   CHROMA_API_KEY=your_chroma_api_key
   
   # Neo4j AuraDB
   NEO4J_URI=your_neo4j_auradb_uri
   NEO4J_USER=your_neo4j_username
   NEO4J_PASSWORD=your_neo4j_password
   
   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. **Run the memory test**:
   ```bash
   npm run test-memory-db
   ```

## Alternative: Local Docker Setup

If you prefer to run locally with Docker:

1. **Start all services**:
   ```bash
   npm run setup
   ```

2. **Wait for services to initialize** (2-3 minutes)

3. **Run the memory test**:
   ```bash
   npm run test-memory-db
   ```

## What the Demo Shows

### 1. Memory System Initialization
- Connection to all three databases
- Creation of memory manager instance

### 2. Memory Storage
- Adding a sample memory about a token swap transaction
- Storing the memory in ChromaDB for semantic search
- Creating knowledge graph relationships in Neo4j

### 3. Memory Retrieval
- Performing semantic search for "token swap"
- Retrieving relevant memories
- Showing the connection between semantic search and graph relationships

## Expected Output

When running `npm run test-memory-db`, you should see:

```
Testing Memory System with Real Databases...
✓ Memory Manager initialized successfully
✓ Added memory with ID: <uuid>
✓ Retrieved memories: 1
Memory System test completed successfully!
```

## Key Features Demonstrated

### 1. Real Database Connections
- No mock implementations
- Actual database operations
- Proper error handling

### 2. Semantic Memory
- Real OpenAI embeddings
- Vector similarity search
- Contextual memory retrieval

### 3. Knowledge Graph
- Relationship mapping between entities
- Graph traversal capabilities
- Persistent graph storage

### 4. Multi-Database Integration
- ChromaDB for vector storage
- Neo4j for relationship mapping
- Supabase for structured data

## Troubleshooting

### Common Issues

1. **API Key Errors**:
   - Verify OPENAI_API_KEY is set correctly
   - Check API key has embedding permissions

2. **Database Connection Errors**:
   - Verify database credentials
   - Check firewall settings for cloud services
   - Ensure services are running

3. **Docker Issues**:
   - Ensure Docker Desktop is running
   - Check available system resources
   - Restart Docker if services are unresponsive

### Quick Fixes

1. **Reset Docker environment**:
   ```bash
   npm run docker:reset
   ```

2. **Check service status**:
   ```bash
   npm run docker:health
   ```

3. **View logs**:
   ```bash
   npm run docker:logs
   ```

## Next Steps

After the demo, you can explore:

1. **Different memory types**:
   - User preferences
   - Strategy outcomes
   - Market observations
   - Reflections

2. **Advanced queries**:
   - Complex semantic searches
   - Graph traversals
   - Combined vector and graph queries

3. **Integration with SEI Agent Kit**:
   - Memory-aware agent tools
   - Contextual decision making
   - Learning from past interactions

## Conclusion

The A-MEM Agent Kit demonstrates how to enhance AI agents with persistent, semantic memory capabilities. This implementation provides a foundation for building more intelligent agents that can learn from past interactions and make context-aware decisions.