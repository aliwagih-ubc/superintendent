import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, getDatabase } from '../../src/queue/database.js';
import { CostRecorder } from '../../src/cost/recorder.js';
import { totalCostUsd } from '../../src/cost/storage.js';

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('record computes cost from usage when costUsd is absent (sdk)', () => {
  new CostRecorder().record({
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'readiness-scorer',
    model: 'claude-sonnet-4-6', source: 'sdk',
    usage: { inputTokens: 1_000_000, outputTokens: 0 },
  });
  assert.equal(totalCostUsd(getDatabase()), 3); // 1M input @ $3
});

test('record uses provided costUsd directly (claude_code)', () => {
  new CostRecorder().record({
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'code-executor',
    model: 'claude-code', source: 'claude_code', costUsd: 0.42,
  });
  assert.equal(totalCostUsd(getDatabase()), 0.42);
});

test('record stores null cost for an unpriced model without throwing', () => {
  new CostRecorder().record({
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'a',
    model: 'mystery-model', source: 'sdk', usage: { inputTokens: 10, outputTokens: 10 },
  });
  assert.equal(totalCostUsd(getDatabase()), 0);
});
