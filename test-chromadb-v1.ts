import axios from 'axios';

async function testChromaDBV1() {
  try {
    console.log('Testing ChromaDB v1 API directly...');
    
    const baseUrl = 'http://chromadb:8000';
    
    // Test heartbeat
    const heartbeatResponse = await axios.get(`${baseUrl}/api/v1/heartbeat`);
    console.log('Heartbeat:', heartbeatResponse.data);
    
    // Test tenant creation
    try {
      const tenantResponse = await axios.post(`${baseUrl}/api/v1/tenants`, {
        name: 'default_tenant'
      });
      console.log('Tenant creation response:', tenantResponse.data);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes('already exists')) {
        console.log('Tenant already exists, which is fine');
      } else {
        throw error;
      }
    }
    
    // Test database creation
    try {
      const dbResponse = await axios.post(`${baseUrl}/api/v1/databases`, {
        name: 'default_database',
        tenant: 'default_tenant'
      });
      console.log('Database creation response:', dbResponse.data);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes('already exists')) {
        console.log('Database already exists, which is fine');
      } else {
        throw error;
      }
    }
    
    console.log('ChromaDB v1 API test completed successfully!');
  } catch (error) {
    console.error('ChromaDB v1 API test failed:', error);
  }
}

testChromaDBV1();