export type MemoryType = 'user_preference' | 'strategy_outcome' | 'transaction_record' | 'market_observation' | 'reflection';

export interface Memory {
  id: string; // UUID
  content: string; // The textual description of the memory
  type: MemoryType;
  timestamp: Date;
  importance: number; // A score from 0.0 to 1.0
  metadata: Record<string, any>; // For transaction hashes, protocol names, etc.
}

// Specialized interface for strategy outcome memories
export interface StrategyOutcomeMemory extends Memory {
  type: 'strategy_outcome';
  metadata: {
    userId: string;
    strategy: string;
    outcome: string;
    profitability: number; // -1 to 1 scale, where -1 is completely unprofitable and 1 is highly profitable
    timestamp: string;
    [key: string]: any; // Additional metadata
  };
}

// Specialized interface for market observation memories
export interface MarketObservationMemory extends Memory {
  type: 'market_observation';
  metadata: {
    userId: string;
    token: string;
    price: number;
    trend: 'up' | 'down' | 'stable';
    timestamp: string;
    [key: string]: any; // Additional metadata
  };
}

// Example Neo4j Node/Relationship types
export type NodeType = 'User' | 'Strategy' | 'Transaction' | 'Protocol' | 'Token';
export type RelationshipType = 'EXECUTED' | 'PREFERS' | 'LEARNED' | 'INTERACTED_WITH';