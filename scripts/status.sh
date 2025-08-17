#!/bin/bash
# scripts/status.sh

echo "=== SEI Agent Kit Status ==="
echo "ChromaDB: $(docker-compose ps chromadb --format 'json' | jq -r '.Status')"
echo "Neo4j: $(docker-compose ps neo4j --format 'json' | jq -r '.Status')"
echo "Supabase DB: $(docker-compose ps supabase_db --format 'json' | jq -r '.Status')"
echo "Agent Kit: $(docker-compose ps agent-kit --format 'json' | jq -r '.Status')"

echo ""
echo "=== Service Endpoints ==="
echo "ChromaDB API: http://localhost:8000"
echo "Neo4j Browser: http://localhost:7474"
echo "Neo4j Bolt: bolt://localhost:7687"
echo "Supabase DB: postgresql://localhost:5432"