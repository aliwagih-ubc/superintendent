import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getDatabase } from '../../src/queue/database.js';
import { buildSnapshot, deriveTicketState } from '../../src/publisher/snapshot.js';

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('deriveTicketState maps queue status to a lifecycle state', () => {
  assert.equal(deriveTicketState('processing', 'refinement'), 'refining');
  assert.equal(deriveTicketState('completed', 'refinement'), 'done');
  assert.equal(deriveTicketState('pending', 'evaluation'), 'queued');
});

test('buildSnapshot maps a queued ticket row and produces a heartbeat', () => {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO linear_ticket_queue (ticket_id, ticket_identifier, task_type, status, readiness_score)
     VALUES ('t1', 'ENG-1', 'evaluation', 'pending', 80)`,
  ).run();
  const snap = buildSnapshot({ version: '0.1.0', pollIntervalSeconds: 30, slotsTotal: 1, slotsUsed: 0 });
  assert.equal(snap.tickets.length, 1);
  assert.equal(snap.tickets[0]!.id, 't1');
  assert.equal(snap.tickets[0]!.identifier, 'ENG-1');
  assert.equal(snap.tickets[0]!.state, 'queued');
  assert.equal(snap.heartbeat.poll_interval_seconds, 30);
  assert.equal(snap.heartbeat.slots_total, 1);
});
