import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpsertClient } from './sync.js';

const CONFLICT: Record<string, string> = {
  tickets: 'id',
  sessions: 'session_id',
  daemon_heartbeat: 'id',
};

export function toUpsertClient(supabase: SupabaseClient): UpsertClient {
  return {
    async upsert(table, rows) {
      const onConflict = CONFLICT[table];
      const query = onConflict
        ? supabase.from(table).upsert(rows as object[], { onConflict })
        : supabase.from(table).insert(rows as object[]);
      const { error } = await query;
      return { error };
    },
  };
}
