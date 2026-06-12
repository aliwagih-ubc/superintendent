import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractCostUsd } from '../../src/agents/providers/claude-code.js';

test('extractCostUsd reads total_cost_usd from a Claude Code result', () => {
  assert.equal(extractCostUsd({ result: 'done', total_cost_usd: 0.37, is_error: false }), 0.37);
});

test('extractCostUsd returns undefined when the field is missing', () => {
  assert.equal(extractCostUsd({ result: 'done' }), undefined);
});
