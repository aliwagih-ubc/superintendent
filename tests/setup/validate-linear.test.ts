import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLinearToken } from '../../scripts/setup/lib/validate.js';

test('validateLinearToken returns ok with workspace name on success', async () => {
  // Inject a fake client builder
  const fakeClient = {
    viewer: Promise.resolve({ id: 'u1', name: 'Ali', organization: { name: 'aliwagih', urlKey: 'aliwagih' } }),
  };
  const result = await validateLinearToken('lin_api_fake', () => fakeClient as any);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.workspaceName, 'aliwagih');
  }
});

test('validateLinearToken returns error when SDK throws', async () => {
  const builder = () => { throw new Error('401 unauthorized'); };
  const result = await validateLinearToken('lin_api_bad', builder as any);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /401|unauthorized/i);
  }
});

test('validateLinearToken returns error on empty input', async () => {
  const result = await validateLinearToken('', (() => null) as any);
  assert.equal(result.ok, false);
});
