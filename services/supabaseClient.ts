
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (config: DatabaseConfig) => {
  if (config.isEnabled && config.url && config.key) {
    try {
      supabase = createClient(config.url, config.key);
      return true;
    } catch (e) {
      console.error("Failed to init supabase", e);
      return false;
    }
  }
  supabase = null;
  return false;
};

export const getSupabase = () => supabase;

// We use a simple Key-Value store pattern for simplicity in this demo app
// Table: 'app_data' -> columns: key (text), value (jsonb), updated_at (timestamptz)

export const syncDataToCloud = async (key: string, data: any) => {
  if (!supabase) return { error: 'Not connected' };
  
  const { error } = await supabase
    .from('app_data')
    .upsert({ 
      key, 
      value: data,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'key' });

  return { error };
};

export const fetchDataFromCloud = async (key: string) => {
  if (!supabase) return { data: null, error: 'Not connected' };

  const { data, error } = await supabase
    .from('app_data')
    .select('value')
    .eq('key', key)
    .single();

  if (error) return { data: null, error };
  return { data: data?.value, error: null };
};

export const checkConnection = async () => {
  if (!supabase) return false;
  // Try simple query
  const { error } = await supabase.from('app_data').select('count', { count: 'exact', head: true });
  return !error;
};

export const generateSQLSchema = () => {
  return `
-- Run this in your Supabase SQL Editor to create the necessary table

CREATE TABLE IF NOT EXISTS app_data (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS) is recommended for production, 
-- but for this demo/MVP we will leave it open or you can enable policies.
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users (if you enable Auth)
-- OR for the purpose of this demo using the Service Role Key or public anon access:
CREATE POLICY "Enable all access for all users" ON app_data
FOR ALL USING (true) WITH CHECK (true);
  `;
};
