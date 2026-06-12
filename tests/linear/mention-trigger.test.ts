import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// mention-trigger imports the eager `config`, which reads process.env at load.
process.env['LINEAR_PERSONAL_TOKEN'] = 'lin_api_personal';
process.env['LINEAR_TEAM_ID'] = '00000000-0000-0000-0000-000000000000';
process.env['GITHUB_REPO'] = 'owner/repo';
process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
process.env['AGENTS_WORK_DIR'] = '/tmp';

const { initDatabase, closeDatabase, getDatabase } = await import('../../src/queue/database.js');
const { commandToTaskType, isMentionProcessed, markMentionProcessed } = await import('../../src/linear/mention-trigger.js');

beforeEach(() => { initDatabase(':memory:'); });
afterEach(() => { closeDatabase(); });

test('commandToTaskType maps each command to its queue task type', () => {
  assert.equal(commandToTaskType('work'), 'execute');
  assert.equal(commandToTaskType('plan'), 'plan');
  assert.equal(commandToTaskType('clarify'), 'refine');
  assert.equal(commandToTaskType('rewrite'), 'consolidate');
  assert.equal(commandToTaskType('help'), null);
});

test('processed mentions are tracked idempotently', () => {
  const db = getDatabase();
  assert.equal(isMentionProcessed(db, 'c1'), false);
  markMentionProcessed(db, { commentId: 'c1', ticketId: 't1', command: 'work' });
  assert.equal(isMentionProcessed(db, 'c1'), true);
  // Re-marking the same comment must not throw and stays processed.
  markMentionProcessed(db, { commentId: 'c1', ticketId: 't1', command: 'work' });
  assert.equal(isMentionProcessed(db, 'c1'), true);
  assert.equal(isMentionProcessed(db, 'c2'), false);
});
