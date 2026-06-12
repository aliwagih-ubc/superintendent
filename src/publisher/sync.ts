import type Database from 'better-sqlite3';
import { getPending, markSynced, markFailed, type OutboxRow } from './outbox.js';

export interface UpsertClient {
  upsert(table: string, rows: unknown[]): Promise<{ error: unknown }>;
}

const BATCH = 100;

export async function syncOnce(db: Database.Database, client: UpsertClient): Promise<void> {
  const pending = getPending(db, BATCH);
  if (pending.length === 0) return;

  const byTable = new Map<string, OutboxRow[]>();
  for (const row of pending) {
    const list = byTable.get(row.targetTable) ?? [];
    list.push(row);
    byTable.set(row.targetTable, list);
  }

  for (const [table, rows] of byTable) {
    const payloads = rows.flatMap((r) => {
      const parsed = JSON.parse(r.payload);
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    const ids = rows.map((r) => r.id);
    const { error } = await client.upsert(table, payloads);
    if (error) {
      markFailed(db, ids);
    } else {
      markSynced(db, ids);
    }
  }
}
