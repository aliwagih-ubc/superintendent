import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env['LINEAR_API_KEY'] = 'lin_api_boot';
process.env['LINEAR_TEAM_ID'] = '00000000-0000-0000-0000-000000000000';
process.env['GITHUB_REPO'] = 'owner/repo';
process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
process.env['AGENTS_WORK_DIR'] = '/tmp';
process.env['SUPABASE_URL'] = 'https://abc.supabase.co';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'svc';

const { initDatabase, closeDatabase, getDatabase } = await import('../../src/queue/database.js');
const { CostRecorder } = await import('../../src/cost/recorder.js');
const { getPending } = await import('../../src/publisher/outbox.js');

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('recording a cost event enqueues it to the outbox when publishing is enabled', () => {
  new CostRecorder().record({
    ticketId: 't1', ticketIdentifier: 'ENG-1', agentType: 'readiness-scorer',
    model: 'claude-sonnet-4-6', source: 'sdk', usage: { inputTokens: 1000, outputTokens: 200 },
  });
  const pending = getPending(getDatabase(), 10);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]!.targetTable, 'cost_events');
  const payload = JSON.parse(pending[0]!.payload);
  assert.equal(payload.ticket_id, 't1');
  assert.equal(payload.agent_type, 'readiness-scorer');
});
