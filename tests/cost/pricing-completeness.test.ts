import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRate } from '../../src/cost/pricing.js';

// Keep in sync with the wizard's model list (scripts/setup/steps/AnthropicStep.tsx).
const WIZARD_MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'];

test('every wizard-offered model has a pricing entry', () => {
  for (const model of WIZARD_MODELS) {
    assert.ok(getRate(model), `missing price for ${model}`);
  }
});
