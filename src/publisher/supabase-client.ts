import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export function createPublisherClient(): SupabaseClient | null {
  if (!config.supabase) return null;
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
