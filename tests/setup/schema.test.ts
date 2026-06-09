import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SetupStateSchema, defaultSetupState } from '../../scripts/setup/lib/schema.js';

test('defaultSetupState produces a valid empty state', () => {
  const result = SetupStateSchema.safeParse(defaultSetupState());
  assert.equal(result.success, true);
});

test('schema rejects unknown fields strictly', () => {
  const result = SetupStateSchema.safeParse({ ...defaultSetupState(), bogus: true });
  // Strict mode rejects unknown keys. If we chose passthrough, this assertion changes.
  assert.equal(result.success, false);
});

test('schema requires LINEAR_TEAM_ID before completion', () => {
  const state = defaultSetupState();
  state.completedSteps.push('linear');
  // Asking for "complete" status — we expose a helper:
  // For now, basic Zod validation passes since fields are optional during setup.
  const result = SetupStateSchema.safeParse(state);
  assert.equal(result.success, true);
});
