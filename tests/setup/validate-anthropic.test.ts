import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAnthropicKey } from '../../scripts/setup/lib/validate.js';

test('validateAnthropicKey returns ok when SDK responds', async () => {
  const fakeClient = {
    messages: {
      create: () => Promise.resolve({ id: 'msg_1', content: [{ type: 'text', text: 'ok' }] }),
    },
  };
  const result = await validateAnthropicKey('sk-ant-fake', 'claude-sonnet-4-6', () => fakeClient as any);
  assert.equal(result.ok, true);
});

test('validateAnthropicKey returns error on 401', async () => {
  const fakeClient = {
    messages: {
      create: () => Promise.reject(Object.assign(new Error('401 invalid x-api-key'), { status: 401 })),
    },
  };
  const result = await validateAnthropicKey('sk-ant-bad', 'claude-sonnet-4-6', () => fakeClient as any);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /401|invalid/i);
});

test('validateAnthropicKey rejects empty key', async () => {
  const result = await validateAnthropicKey('', 'claude-sonnet-4-6', (() => ({})) as any);
  assert.equal(result.ok, false);
});
