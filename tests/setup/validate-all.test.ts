import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAllChecks } from '../../scripts/setup/lib/validate.js';
import { defaultSetupState } from '../../scripts/setup/lib/schema.js';

test('runAllChecks reports each section with ok/fail', async () => {
  const state = defaultSetupState();
  state.LINEAR_PERSONAL_TOKEN = '';        // empty → linear fails
  state.ANTHROPIC_API_KEY = '';            // empty → anthropic fails
  state.AGENTS_WORK_DIR = '/does/not/exist'; // → repo fails

  const result = await runAllChecks(state, {
    linearBuilder: () => ({ viewer: Promise.resolve({ organization: { urlKey: 'x' } }) }) as any,
    anthropicBuilder: () => ({ messages: { create: () => Promise.resolve({}) } }) as any,
  });
  assert.equal(result.linear.ok, false);
  assert.equal(result.anthropic.ok, false);
  assert.equal(result.repo.ok, false);
});
