export type MemoryType = 'user_preference' | 'strategy_outcome' | 'transaction_record' | 'market_observation' | 'reflection';

export interface Memory {
  id: string; // UUID
  content: string; // The textual description of the memory
  type: MemoryType;
  timestamp: Date;
  importance: number; // A score from 0.0 to 1.0
  metadata: Record<string, any>; // For transaction hashes, protocol names, etc.
}

// Example Neo4j Node/Relationship types
export type NodeType = 'User' | 'Strategy' | 'Transaction' | 'Protocol' | 'Token';
export type RelationshipType = 'EXECUTED' | 'PREFERS' | 'LEARNED' | 'INTERACTED_WITH';