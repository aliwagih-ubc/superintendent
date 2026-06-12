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

test('selfReviewEnabled defaults to true', () => {
  setRequiredEnv();
  delete process.env['SELF_REVIEW_ENABLED'];
  assert.equal(loadConfig().agents.selfReviewEnabled, true);
});

test('SELF_REVIEW_ENABLED=false disables it', () => {
  setRequiredEnv();
  process.env['SELF_REVIEW_ENABLED'] = 'false';
  assert.equal(loadConfig().agents.selfReviewEnabled, false);
});
