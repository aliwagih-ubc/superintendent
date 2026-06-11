import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getDatabase } from '../../src/queue/database.js';
import { insertCostEvent, totalCostUsd, costByTicket } from '../../src/cost/storage.js';

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('insertCostEvent persists a row and totals it', () => {
  const db = getDatabase();
  insertCostEvent(db, {
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'readiness-scorer',
    model: 'claude-haiku-4-5', source: 'sdk',
    usage: { inputTokens: 100, outputTokens: 50 }, costUsd: 0.5,
  });
  assert.equal(totalCostUsd(db), 0.5);
});

test('costByTicket groups and sums per ticket', () => {
  const db = getDatabase();
  insertCostEvent(db, { ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'a', model: 'm', source: 'sdk', costUsd: 0.5 });
  insertCostEvent(db, { ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'a', model: 'm', source: 'sdk', costUsd: 0.25 });
  insertCostEvent(db, { ticketId: 't2', ticketIdentifier: 'ENG-2', agentType: 'a', model: 'm', source: 'sdk', costUsd: 1 });
  const rows = costByTicket(db);
  assert.deepEqual(rows, [
    { ticketId: 't2', costUsd: 1 },
    { ticketId: 't1', costUsd: 0.75 },
  ]);
});

test('a null cost (unpriced model) is stored without breaking totals', () => {
  const db = getDatabase();
  insertCostEvent(db, { ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'a', model: 'm', source: 'sdk', costUsd: null });
  assert.equal(totalCostUsd(db), 0);
});
