#!/bin/bash
# scripts/init-chromadb.sh

echo "Initializing ChromaDB..."

# Wait for ChromaDB to be ready
while ! curl -s http://chromadb:8000/api/v1/heartbeat >/dev/null; do
  echo "Waiting for ChromaDB..."
  sleep 2
done

# Create collections
curl -X POST http://chromadb:8000/api/v1/collections \
  -H "Content-Type: application/json" \
  -d '{"name": "agent_memories", "metadata": {"description": "Agent memory storage"}}'

echo "ChromaDB initialization complete."