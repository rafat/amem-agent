import { CloudClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config();

let client: CloudClient | null = null;

export function getChromaClient(): CloudClient {
  if (!client) {
    const apiKey = process.env.CHROMA_API_KEY;
    if (!apiKey) {
      throw new Error('CHROMA_API_KEY environment variable is not set');
    }
    
    // Use default tenant and database if not specified in env
    const tenant = process.env.CHROMA_TENANT || '0123621e-d7b1-49af-b9f4-084893cb7c89';
    const database = process.env.CHROMA_DATABASE || 'amem';
    
    client = new CloudClient({
      apiKey: apiKey,
      tenant: tenant,
      database: database
    });
  }
  
  return client;
}