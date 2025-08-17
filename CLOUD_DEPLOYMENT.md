# Cloud Deployment Guide for A-MEM Agent Kit

This guide explains how to deploy the A-MEM Agent Kit with advanced memory capabilities to cloud services for a demo environment.

## Overview

Instead of running all services locally with Docker (which can be slow), we can deploy the databases to cloud services and run the application locally or on a cloud VM.

## Cloud Database Options

### 1. ChromaDB
- **Option 1**: Use ChromaDB Cloud (https://www.trychroma.com/)
- **Option 2**: Deploy to a cloud VM (AWS EC2, Google Cloud, Azure)
- **Option 3**: Use a managed PostgreSQL service with ChromaDB

### 2. Neo4j
- **Option 1**: Use Neo4j AuraDB (https://neo4j.com/cloud/)
- **Option 2**: Deploy to a cloud VM
- **Option 3**: Use a managed service like AWS Neptune or Google Cloud Neo4j

### 3. Supabase
- **Option 1**: Use Supabase Cloud (https://supabase.com/)
- **Option 2**: Deploy to a cloud VM
- **Option 3**: Use a managed PostgreSQL service

## Recommended Cloud Setup

For a quick demo, we recommend using the cloud services:

1. **ChromaDB Cloud**:
   - Sign up at https://www.trychroma.com/
   - Create a new project
   - Get the API endpoint and authentication token

2. **Neo4j AuraDB**:
   - Sign up at https://neo4j.com/cloud/
   - Create a free database instance
   - Note the connection URI, username, and password

3. **Supabase Cloud**:
   - Sign up at https://supabase.com/
   - Create a new project
   - Get the database connection string and API keys

## Environment Configuration

Create a `.env` file with the cloud service credentials:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# SEI Blockchain Configuration
SEI_PRIVATE_KEY=your_sei_private_key_here
RPC_URL=https://evm-rpc-testnet.sei-apis.com

# ChromaDB Cloud Configuration
CHROMA_URL=your_chroma_cloud_endpoint
CHROMA_API_KEY=your_chroma_api_key

# Neo4j AuraDB Configuration
NEO4J_URI=your_neo4j_auradb_uri
NEO4J_USER=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Running the Application

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd amem-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your cloud service credentials
   ```

4. Run the application:
   ```bash
   npm run test-memory-db
   ```

## Alternative: Single Cloud VM

If you prefer to run everything on a single cloud VM:

1. Provision a VM (e.g., AWS EC2, Google Cloud VM, Azure VM)
2. Install Docker and Docker Compose
3. Clone the repository
4. Run the Docker setup:
   ```bash
   npm run setup
   ```

This approach gives you the benefits of containerization without running locally.

## Performance Considerations

When using cloud services:

1. **Latency**: Cloud services may have higher latency than local services
2. **Cost**: Monitor usage to avoid unexpected charges
3. **Security**: Use strong authentication and limit access to services
4. **Backup**: Regularly backup your data

## Troubleshooting

### Connection Issues
- Verify all credentials are correct
- Check firewall settings for cloud services
- Ensure services are running and accessible

### Performance Issues
- Consider using closer geographic regions
- Upgrade to paid tiers for better performance
- Monitor resource usage

### Data Persistence
- Cloud services typically offer better persistence than local Docker volumes
- Regularly backup important data