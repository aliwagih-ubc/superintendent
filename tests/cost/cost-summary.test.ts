import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getDatabase } from '../../src/queue/database.js';
import { insertCostEvent, costSummaryForTicket } from '../../src/cost/storage.js';

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('costSummaryForTicket sums cost, tokens, and events for one ticket', () => {
  const db = getDatabase();
  insertCostEvent(db, {
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'a', model: 'm', source: 'sdk',
    usage: { inputTokens: 100, outputTokens: 50, cacheReadTokens: 10, cacheWriteTokens: 5 }, costUsd: 0.5,
  });
  insertCostEvent(db, {
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'b', model: 'm', source: 'claude_code',
    usage: { inputTokens: 200, outputTokens: 100 }, costUsd: 1.25,
  });
  insertCostEvent(db, {
    ticketId: 't2', ticketIdentifier: 'ENG-2', agentType: 'a', model: 'm', source: 'sdk', costUsd: 9,
  });

  assert.deepEqual(costSummaryForTicket(db, 't1'), {
    costUsd: 1.75,
    inputTokens: 300,
    outputTokens: 150,
    cacheReadTokens: 10,
    cacheWriteTokens: 5,
    eventCount: 2,
  });
});

test('costSummaryForTicket returns zeros for a ticket with no events', () => {
  const db = getDatabase();
  assert.deepEqual(costSummaryForTicket(db, 'missing'), {
    costUsd: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, eventCount: 0,
  });
});
