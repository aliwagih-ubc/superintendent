import { test } from 'node:test';
import assert from 'node:assert/strict';

function setRequiredEnv() {
  process.env['LINEAR_PERSONAL_TOKEN'] = 'lin_api_personal';
  process.env['LINEAR_TEAM_ID'] = '00000000-0000-0000-0000-000000000000';
  process.env['GITHUB_REPO'] = 'owner/repo';
  process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
  process.env['AGENTS_WORK_DIR'] = '/tmp';
}

setRequiredEnv();
const { loadConfig } = await import('../../src/config.js');

test('codingProvider defaults to claude-code', () => {
  setRequiredEnv();
  delete process.env['CODING_PROVIDER'];
  assert.equal(loadConfig().agents.codingProvider, 'claude-code');
});

test('codingProvider reads CODING_PROVIDER', () => {
  setRequiredEnv();
  process.env['CODING_PROVIDER'] = 'gemini';
  assert.equal(loadConfig().agents.codingProvider, 'gemini');
});

test('an invalid CODING_PROVIDER is rejected', () => {
  setRequiredEnv();
  process.env['CODING_PROVIDER'] = 'cursor';
  assert.throws(() => loadConfig());
});
