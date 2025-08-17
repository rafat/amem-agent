import axios from 'axios';

async function testChromaDBV2Basic() {
  try {
    console.log('Testing ChromaDB v2 API basic functionality...');
    
    const baseUrl = 'http://chromadb:8000';
    
    // Test heartbeat
    const heartbeatResponse = await axios.get(`${baseUrl}/api/v2/heartbeat`);
    console.log('Heartbeat:', heartbeatResponse.data);
    
    // Test tenant retrieval
    try {
      const tenantResponse = await axios.get(`${baseUrl}/api/v2/tenants/default_tenant`);
      console.log('Tenant retrieval response:', tenantResponse.data);
    } catch (error: any) {
      console.error('Tenant retrieval failed:', error.response?.data || error.message);
    }
    
    // Test collection creation directly
    try {
      const collectionResponse = await axios.post(`${baseUrl}/api/v2/tenants/default_tenant/databases/default_database/collections`, {
        name: 'test_collection',
        metadata: {
          description: 'Test collection for verification'
        }
      });
      console.log('Collection creation response:', collectionResponse.data);
    } catch (error: any) {
      console.error('Collection creation failed:', error.response?.data || error.message);
    }
    
    console.log('ChromaDB v2 API basic test completed!');
  } catch (error) {
    console.error('ChromaDB v2 API basic test failed:', error);
  }
}

testChromaDBV2Basic();