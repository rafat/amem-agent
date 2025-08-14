import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!url || !anonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables');
    }
    
    client = createClient(url, anonKey);
  }
  
  return client;
}