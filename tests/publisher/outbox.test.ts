import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getDatabase } from '../../src/queue/database.js';
import { enqueue, getPending, markSynced, markFailed } from '../../src/publisher/outbox.js';

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('enqueue then getPending returns the row with parsed payload', () => {
  const db = getDatabase();
  enqueue(db, 'cost_events', { ticketId: 't1', costUsd: 0.5 });
  const pending = getPending(db, 10);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]!.targetTable, 'cost_events');
  assert.deepEqual(JSON.parse(pending[0]!.payload), { ticketId: 't1', costUsd: 0.5 });
});

test('markSynced removes rows from pending', () => {
  const db = getDatabase();
  enqueue(db, 'cost_events', { a: 1 });
  const ids = getPending(db, 10).map((r) => r.id);
  markSynced(db, ids);
  assert.equal(getPending(db, 10).length, 0);
});

test('markFailed increments attempts but keeps the row pending', () => {
  const db = getDatabase();
  enqueue(db, 'cost_events', { a: 1 });
  const ids = getPending(db, 10).map((r) => r.id);
  markFailed(db, ids);
  const pending = getPending(db, 10);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]!.attempts, 1);
});
