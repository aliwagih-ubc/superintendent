import type Database from 'better-sqlite3';
import { config } from '../config.js';

export function isPublishingEnabled(): boolean {
  return config.supabase !== undefined;
}

export interface OutboxRow {
  id: number;
  targetTable: string;
  payload: string;
  attempts: number;
}

export function enqueue(db: Database.Database, targetTable: string, payload: unknown): void {
  db.prepare('INSERT INTO sync_outbox (target_table, payload) VALUES (?, ?)')
    .run(targetTable, JSON.stringify(payload));
}

export function getPending(db: Database.Database, limit = 100): OutboxRow[] {
  return db.prepare(
    `SELECT id, target_table AS targetTable, payload, attempts
     FROM sync_outbox WHERE status = 'pending' ORDER BY id ASC LIMIT ?`,
  ).all(limit) as OutboxRow[];
}

export function markSynced(db: Database.Database, ids: number[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(
    `UPDATE sync_outbox SET status = 'synced', synced_at = datetime('now') WHERE id IN (${placeholders})`,
  ).run(...ids);
}

export function markFailed(db: Database.Database, ids: number[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE sync_outbox SET attempts = attempts + 1 WHERE id IN (${placeholders})`).run(...ids);
}
