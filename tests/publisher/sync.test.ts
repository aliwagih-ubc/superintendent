import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getDatabase } from '../../src/queue/database.js';
import { enqueue, getPending } from '../../src/publisher/outbox.js';
import { syncOnce, type UpsertClient } from '../../src/publisher/sync.js';

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

function fakeClient(calls: Array<{ table: string; rows: unknown[] }>, fail = false): UpsertClient {
  return {
    async upsert(table, rows) {
      calls.push({ table, rows });
      return fail ? { error: new Error('boom') } : { error: null };
    },
  };
}

test('syncOnce drains pending cost_events and marks them synced on success', async () => {
  const db = getDatabase();
  enqueue(db, 'cost_events', { ticket_id: 't1', cost_usd: 0.5 });
  const calls: Array<{ table: string; rows: unknown[] }> = [];
  await syncOnce(db, fakeClient(calls));
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.table, 'cost_events');
  assert.equal(getPending(db, 10).length, 0);
});

test('syncOnce keeps rows pending and increments attempts on failure', async () => {
  const db = getDatabase();
  enqueue(db, 'cost_events', { ticket_id: 't1' });
  await syncOnce(db, fakeClient([], true));
  const pending = getPending(db, 10);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]!.attempts, 1);
});

test('syncOnce flattens array payloads (snapshot tables)', async () => {
  const db = getDatabase();
  enqueue(db, 'tickets', [{ id: 't1', state: 'queued' }, { id: 't2', state: 'done' }]);
  const calls: Array<{ table: string; rows: unknown[] }> = [];
  await syncOnce(db, fakeClient(calls));
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.table, 'tickets');
  assert.equal((calls[0]!.rows as unknown[]).length, 2);
  assert.equal(getPending(db, 10).length, 0);
});
