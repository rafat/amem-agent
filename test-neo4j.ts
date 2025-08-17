import neo4j, { Driver, Config } from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables explicitly from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testNeo4j() {
  let driver: Driver | null = null;
  
  try {
    console.log('Testing Neo4j connection...');
    
    // Debug environment variables
    console.log('Environment variables:');
    console.log('NEO4J_URI:', process.env.NEO4J_URI);
    console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME);
    console.log('NEO4J_USER:', process.env.NEO4J_USER);
    console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '[SET]' : '[NOT SET]');
    
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    console.log(`Connecting to: ${uri} with user: ${user}`);
    
    // Configure for AuraDB/encrypted connections
    // For neo4j+s:// URIs, encryption is already configured in the URL
    const config: Config = {};
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), config);
    
    // Test connection
    const session = driver.session();
    try {
      const result = await session.run('RETURN 1 AS num');
      console.log('Neo4j connection successful:', result.records[0].get('num'));
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j connection failed:', error);
  } finally {
    if (driver) {
      await driver.close();
    }
  }
}

testNeo4j();