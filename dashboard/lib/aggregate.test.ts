import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumBy, groupSum } from './aggregate';
import type { CostEvent } from './types';

const ev = (over: Partial<CostEvent>): CostEvent => ({
  id: 1, ticket_id: 't1', ticket_identifier: 'ENG-1', ticket_title: null, session_id: null,
  agent_type: 'a', model: 'claude-sonnet-4-6', source: 'sdk',
  input_tokens: null, output_tokens: null, cache_read_tokens: null, cache_write_tokens: null,
  cost_usd: 1, developer: null, created_at: '2026-06-11T00:00:00Z', ...over,
});

test('sumBy totals cost_usd ignoring nulls', () => {
  assert.equal(sumBy([ev({ cost_usd: 1 }), ev({ cost_usd: 2 }), ev({ cost_usd: null })]), 3);
});

test('groupSum groups by a key and sums cost', () => {
  const rows = groupSum(
    [ev({ ticket_id: 't1', cost_usd: 1 }), ev({ ticket_id: 't1', cost_usd: 2 }), ev({ ticket_id: 't2', cost_usd: 5 })],
    (e) => e.ticket_id,
  );
  assert.deepEqual(rows, [{ key: 't2', cost: 5 }, { key: 't1', cost: 3 }]);
});
