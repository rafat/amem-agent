import { CloudClient } from 'chromadb';
import 'dotenv/config';

async function testChromaCloud() {
  try {
    console.log('Testing ChromaDB Cloud connection...');
    
    // Initialize CloudClient
    const client = new CloudClient({
      apiKey: process.env.CHROMA_API_KEY || '',
      tenant: process.env.CHROMA_TENANT || 'default_tenant',
      database: process.env.CHROMA_DATABASE || 'default_database'
    });
    
    // Test getting tenant
    console.log('Getting tenant info...');
    const tenant = client.tenant;
    console.log('Tenant:', tenant);
    
    // Test getting database
    console.log('Getting database info...');
    const database = client.database;
    console.log('Database:', database);
    
    // Test creating/getting a collection
    console.log('Getting or creating collection...');
    const collection = await client.getOrCreateCollection({ name: 'test_collection' });
    console.log('Collection:', collection.name);
    
    // Add a test document
    console.log('Adding test document...');
    await collection.add({
      ids: ['1'],
      documents: ['This is a test document for ChromaDB Cloud'],
      metadatas: [{ test: 'metadata' }]
    });
    console.log('Document added successfully');
    
    // Query the document
    console.log('Querying document...');
    const results = await collection.query({
      queryTexts: ['test document'],
      nResults: 1
    });
    console.log('Query results:', results);
    
    console.log('ChromaDB Cloud test completed successfully!');
  } catch (error) {
    console.error('ChromaDB Cloud test failed:', error);
  }
}

testChromaCloud();