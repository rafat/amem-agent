#!/bin/bash
# scripts/backup.sh

echo "Creating backups..."

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Backup ChromaDB
docker-compose exec chromadb sh -c "cd /chroma/chroma && tar -czf /tmp/chroma_backup.tar.gz ."
docker cp $(docker-compose ps -q chromadb):/tmp/chroma_backup.tar.gz ./backups/chroma_$(date +%Y%m%d_%H%M%S).tar.gz

# Backup Neo4j
docker-compose exec neo4j neo4j-admin dump --database=neo4j --to=/tmp/neo4j_backup.dump
docker cp $(docker-compose ps -q neo4j):/tmp/neo4j_backup.dump ./backups/neo4j_$(date +%Y%m%d_%H%M%S).dump

echo "Backups completed."