import { test } from 'node:test';
import assert from 'node:assert/strict';
import { costForUsage, getRate, knownModels } from '../../src/cost/pricing.js';

test('costForUsage computes sonnet cost from token counts', () => {
  // 1,000,000 input @ $3, 1,000,000 output @ $15 = $18 exactly
  const cost = costForUsage('claude-sonnet-4-6', { inputTokens: 1_000_000, outputTokens: 1_000_000 });
  assert.equal(cost, 18);
});

test('costForUsage includes cache tokens', () => {
  // 1,000,000 cache-read @ $0.30 = $0.30
  const cost = costForUsage('claude-sonnet-4-6', {
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000,
  });
  assert.equal(cost, 0.3);
});

test('costForUsage returns null for an unknown model', () => {
  assert.equal(costForUsage('not-a-model', { inputTokens: 10, outputTokens: 10 }), null);
});

test('knownModels and getRate agree', () => {
  for (const m of knownModels()) {
    assert.ok(getRate(m), `rate exists for ${m}`);
  }
});
