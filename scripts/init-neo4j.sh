#!/bin/bash
# scripts/init-neo4j.sh

echo "Initializing Neo4j..."

# Wait for Neo4j to be ready
until cypher-shell -u neo4j -p password "RETURN 1" >/dev/null 2>&1; do
  echo "Waiting for Neo4j..."
  sleep 5
done

# Create constraints for uniqueness
cypher-shell -u neo4j -p password <<EOF
CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT unique_protocol_name IF NOT EXISTS FOR (p:Protocol) REQUIRE p.name IS UNIQUE;
CREATE CONSTRAINT unique_token_symbol IF NOT EXISTS FOR (t:Token) REQUIRE t.symbol IS UNIQUE;
CREATE CONSTRAINT unique_transaction_hash IF NOT EXISTS FOR (tx:Transaction) REQUIRE tx.hash IS UNIQUE;
EOF

# Create indexes for performance
cypher-shell -u neo4j -p password <<EOF
CREATE INDEX idx_transaction_timestamp IF NOT EXISTS FOR (tx:Transaction) ON (tx.timestamp);
CREATE INDEX idx_memory_importance IF NOT EXISTS FOR (m:Memory) ON (m.importance);
EOF

echo "Neo4j initialization complete."