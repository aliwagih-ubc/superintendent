import { test } from 'node:test';
import assert from 'node:assert/strict';

function clearAuthEnv() {
  delete process.env['LINEAR_CLIENT_ID'];
  delete process.env['LINEAR_CLIENT_SECRET'];
  delete process.env['LINEAR_API_KEY'];
  delete process.env['LINEAR_PERSONAL_TOKEN'];
}

function setRequiredEnv() {
  process.env['LINEAR_TEAM_ID'] = '00000000-0000-0000-0000-000000000000';
  process.env['GITHUB_REPO'] = 'owner/repo';
  process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
  process.env['AGENTS_WORK_DIR'] = '/tmp';
}

// Use a working auth mode for the module's import-time loadConfig() so the
// module loads cleanly; individual tests then set the mode they exercise.
clearAuthEnv();
setRequiredEnv();
process.env['LINEAR_API_KEY'] = 'lin_api_boot';
const { loadConfig } = await import('../../src/config.js');

test('LINEAR_PERSONAL_TOKEN is accepted as apikey-mode auth', () => {
  clearAuthEnv();
  setRequiredEnv();
  process.env['LINEAR_PERSONAL_TOKEN'] = 'lin_api_personal';
  const cfg = loadConfig();
  assert.deepEqual(cfg.linear.auth, { mode: 'apikey', apiKey: 'lin_api_personal' });
});

test('LINEAR_API_KEY still works (legacy)', () => {
  clearAuthEnv();
  setRequiredEnv();
  process.env['LINEAR_API_KEY'] = 'lin_api_legacy';
  const cfg = loadConfig();
  assert.deepEqual(cfg.linear.auth, { mode: 'apikey', apiKey: 'lin_api_legacy' });
});

test('OAuth client id/secret takes precedence over a personal token', () => {
  clearAuthEnv();
  setRequiredEnv();
  process.env['LINEAR_CLIENT_ID'] = 'cid';
  process.env['LINEAR_CLIENT_SECRET'] = 'csecret';
  process.env['LINEAR_PERSONAL_TOKEN'] = 'lin_api_ignored';
  const cfg = loadConfig();
  assert.deepEqual(cfg.linear.auth, { mode: 'oauth', clientId: 'cid', clientSecret: 'csecret' });
});

test('missing all Linear auth throws', () => {
  clearAuthEnv();
  setRequiredEnv();
  assert.throws(() => loadConfig(), /Linear authentication required/);
});
