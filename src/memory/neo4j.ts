import neo4j, { Driver, Config } from 'neo4j-driver';
import * as dotenv from 'dotenv';

dotenv.config();

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    // Configure for AuraDB/encrypted connections
    // For neo4j+s:// URIs, encryption is already configured in the URL
    const config: Config = {};
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), config);
  }
  
  return driver;
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}