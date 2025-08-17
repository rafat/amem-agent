import { ChromaClient, CloudClient } from 'chromadb';
import * as dotenv from 'dotenv';

dotenv.config();

let client: ChromaClient | CloudClient | null = null;

export function getChromaClient(): ChromaClient | CloudClient {
  if (!client) {
    // Check if we should use CloudClient or local ChromaClient
    const useCloud = process.env.CHROMA_API_KEY && process.env.CHROMA_API_KEY.length > 0;
    
    if (useCloud) {
      // Use CloudClient for ChromaDB Cloud
      const apiKey = process.env.CHROMA_API_KEY;
      if (!apiKey) {
        throw new Error('CHROMA_API_KEY environment variable is not set');
      }
      
      const tenant = process.env.CHROMA_TENANT || 'default_tenant';
      const database = process.env.CHROMA_DATABASE || 'default_database';
      
      client = new CloudClient({
        apiKey: apiKey,
        tenant: tenant,
        database: database
      });
    } else {
      // Use ChromaClient for local instance
      const url = process.env.CHROMA_URL || 'http://localhost:8000';
      
      client = new ChromaClient({ path: url });
    }
  }
  
  return client;
}