# Complete Setup Guide

This guide will help you set up the SEI Agent Kit with Advanced Memory system locally using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Docker daemon running (Docker Desktop on macOS/Windows)
- Node.js 18+ (for local development)
- Git

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd amem-agent
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   
3. Edit the `.env` file with your actual API keys:
   - `OPENAI_API_KEY` - Required for embeddings and LLM
   - `SEI_PRIVATE_KEY` - Your SEI wallet private key
   - Other keys as needed for Twitter, etc.

4. Build and start all services:
   ```bash
   npm run setup
   ```

5. Run the agent:
   ```bash
   docker-compose exec agent-kit npm run test
   ```

## Detailed Setup

### 1. Environment Configuration

The `.env` file contains all necessary configuration variables. The most important ones for the memory system are:

```env
# Database Configuration (set automatically by Docker)
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
CHROMA_URL=http://chromadb:8000
SUPABASE_URL=postgresql://postgres:postgres@supabase_db:5432/postgres
SUPABASE_ANON_KEY=your-anon-key-here

# API Keys (you need to set these)
OPENAI_API_KEY=your_actual_openai_api_key
SEI_PRIVATE_KEY=your_sei_wallet_private_key
```

### 2. Docker Services

The Docker setup includes:

1. **ChromaDB** - Vector database for semantic memory storage
2. **Neo4j** - Graph database for knowledge relationships
3. **Supabase** - Relational database for structured data
4. **Agent Kit** - The main application service

### 3. Database Initialization

The system automatically initializes the databases on first run:

- ChromaDB collection for agent memories
- Neo4j constraints and indexes
- Supabase schema (when implemented)

## Testing the Setup

### Test Database Connection

Run the memory database test:
```bash
docker-compose exec agent-kit npm run test-memory-db
```

### Test Memory System

Run the memory system test:
```bash
docker-compose exec agent-kit npm run test-memory
```

### Interactive Agent

Run the interactive agent:
```bash
docker-compose exec agent-kit npm run test
```

## Management Commands

- `npm run docker:build` - Rebuild all services
- `npm run docker:start` - Start all services
- `npm run docker:stop` - Stop all services
- `npm run docker:reset` - Reset all services and data
- `npm run docker:logs` - View logs from all services

## Data Persistence

All data is persisted in Docker volumes:
- `chroma_data` - ChromaDB data
- `neo4j_data` - Neo4j database files
- `supabase_data` - Supabase database files

To backup data:
```bash
npm run docker:backup
```

## Troubleshooting

### Common Issues

1. **Services not starting**: Check logs with `npm run docker:logs`
2. **Database connection errors**: Ensure all services are running
3. **API key errors**: Verify your `.env` file contains valid keys

### Resetting the Environment

If you need to start fresh:
```bash
npm run docker:reset
```

This will remove all data and recreate the services.

## Development Workflow

For local development:

1. Start services: `npm run docker:start`
2. Make code changes
3. Run tests: `docker-compose exec agent-kit npm test`
4. View logs: `npm run docker:logs`

The application code is mounted as a volume, so changes are reflected immediately.