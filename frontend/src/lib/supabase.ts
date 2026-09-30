import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rcviajizjxiiuqsiqwsn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdmlhaml6anhpaXVxc2lxd3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDEwNjYsImV4cCI6MjEwNjMxNzA2Nn0.8ZNRDo3ld0CNogbUNOD4wYhr7CI9793RVC75YcVWW2o';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
