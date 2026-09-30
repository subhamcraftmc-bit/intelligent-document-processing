import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const isSupabaseConfigured = () => {
  return Boolean(
    config.supabase.url &&
    !config.supabase.url.includes('your-project') &&
    config.supabase.anonKey &&
    !config.supabase.anonKey.includes('your-anon-key')
  );
};

export let supabaseClient = null;
export let supabaseAdmin = null;

if (isSupabaseConfigured()) {
  try {
    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const adminKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
    supabaseAdmin = createClient(config.supabase.url, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('Supabase client initialized successfully', { url: config.supabase.url });
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
  }
} else {
  logger.warn('Supabase credentials not configured. Running with in-memory database & local storage fallback.');
}
