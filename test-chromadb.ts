import { ChromaClient } from 'chromadb';

async function testChromaDB() {
  try {
    console.log('Testing ChromaDB connection...');
    
    // Create client
    const client = new ChromaClient({ path: 'http://chromadb:8000' });
    
    // Test heartbeat
    const heartbeat = await client.heartbeat();
    console.log('Heartbeat:', heartbeat);
    
    // Try to get or create collection
    console.log('Getting or creating collection...');
    const collection = await client.getOrCreateCollection({ name: 'test_collection' });
    console.log('Collection created/retrieved:', collection.name);
    
    // Add a test document
    console.log('Adding test document...');
    await collection.add({
      ids: ['1'],
      documents: ['This is a test document'],
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
    
    console.log('ChromaDB test completed successfully!');
  } catch (error) {
    console.error('ChromaDB test failed:', error);
  }
}

testChromaDB();