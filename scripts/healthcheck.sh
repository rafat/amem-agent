#!/bin/bash
# scripts/healthcheck.sh

echo "=== SEI Agent Kit Health Check ==="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running"
  exit 1
fi

echo "✓ Docker is running"

# Check if services are running
SERVICES=("chromadb" "neo4j" "agent-kit")

for service in "${SERVICES[@]}"; do
  if docker-compose ps | grep -q "$service.*Up"; then
    echo "✓ $service is running"
  else
    echo "❌ $service is not running"
  fi
done

# Check database connections
echo ""
echo "=== Database Connection Tests ==="

# Test ChromaDB
if curl -s http://localhost:8000/api/v1/heartbeat >/dev/null; then
  echo "✓ ChromaDB is accessible"
else
  echo "❌ ChromaDB is not accessible"
fi

# Test Neo4j (basic check)
if nc -z localhost 7687; then
  echo "✓ Neo4j Bolt port is accessible"
else
  echo "❌ Neo4j Bolt port is not accessible"
fi

echo ""
echo "Run 'npm run docker:logs' to see detailed logs"