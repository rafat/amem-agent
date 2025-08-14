import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config();

let client: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!client) {
    const url = process.env.CHROMA_URL || 'http://localhost:8000';
    client = new ChromaClient({ path: url });
  }
  
  return client;
}