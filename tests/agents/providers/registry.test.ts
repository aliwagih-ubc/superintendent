import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProviderName } from '../../../src/agents/providers/registry.js';

test('falls back to the default when no provider label is present', () => {
  assert.equal(resolveProviderName(['bug', 'frontend'], 'claude-code'), 'claude-code');
});

test('a provider label overrides the default', () => {
  assert.equal(resolveProviderName(['provider:gemini'], 'claude-code'), 'gemini');
  assert.equal(resolveProviderName(['provider:codex'], 'gemini'), 'codex');
});

test('an unknown provider label is ignored and the default is used', () => {
  assert.equal(resolveProviderName(['provider:cursor'], 'claude-code'), 'claude-code');
});

test('label matching is case-insensitive and trims whitespace', () => {
  assert.equal(resolveProviderName([' Provider:Gemini '], 'claude-code'), 'gemini');
});
