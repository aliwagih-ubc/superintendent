import { test } from 'node:test';
import assert from 'node:assert/strict';

function baseEnv() {
  process.env['LINEAR_API_KEY'] = 'lin_api_boot';
  process.env['LINEAR_TEAM_ID'] = '00000000-0000-0000-0000-000000000000';
  process.env['GITHUB_REPO'] = 'owner/repo';
  process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
  process.env['AGENTS_WORK_DIR'] = '/tmp';
}

baseEnv();
const { loadConfig } = await import('../../src/config.js');

test('supabase config is undefined when env vars are absent', () => {
  delete process.env['SUPABASE_URL'];
  delete process.env['SUPABASE_SERVICE_ROLE_KEY'];
  baseEnv();
  assert.equal(loadConfig().supabase, undefined);
});

test('supabase config is populated when both env vars are present', () => {
  baseEnv();
  process.env['SUPABASE_URL'] = 'https://abc.supabase.co';
  process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'service-key';
  assert.deepEqual(loadConfig().supabase, {
    url: 'https://abc.supabase.co',
    serviceRoleKey: 'service-key',
  });
});
