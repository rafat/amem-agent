#!/bin/bash
# scripts/start.sh

echo "Starting SEI Agent Kit with Advanced Memory..."

# Initialize databases
echo "Initializing databases..."
./scripts/init-chromadb.sh
./scripts/init-neo4j.sh

# Start the main application
echo "Starting application..."
npm run test