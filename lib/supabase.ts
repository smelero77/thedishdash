import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
const envPath = resolve(__dirname, '../.env.local');
config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✓ Present' : '✗ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓ Present' : '✗ Missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Instancia única de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    storageKey: 'supabase.auth.token'
  }
});