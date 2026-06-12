import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claudeCodeProvider } from '../../../src/agents/providers/claude-code.js';

test('name is claude-code', () => {
  assert.equal(claudeCodeProvider.name, 'claude-code');
});

test('buildSpawn requests stream-json non-interactive mode with the prompt', () => {
  const s = claudeCodeProvider.buildSpawn('do the thing', '/tmp/wt');
  const all = [s.command, ...s.args].join(' ');
  assert.match(all, /--output-format stream-json/);
  assert.match(all, /--dangerously-skip-permissions/);
  assert.ok(s.args.includes('do the thing'));
});

test('parseOutput reads PR url and total_cost_usd from a stream-json result line', () => {
  const line = JSON.stringify({
    type: 'result', result: 'Opened https://github.com/o/r/pull/9', total_cost_usd: 0.42, is_error: false,
  });
  const r = claudeCodeProvider.parseOutput(line, 0);
  assert.equal(r.success, true);
  assert.equal(r.prUrl, 'https://github.com/o/r/pull/9');
  assert.equal(r.costUsd, 0.42);
});

test('parseOutput marks failure on a nonzero exit with no json', () => {
  const r = claudeCodeProvider.parseOutput('boom', 1);
  assert.equal(r.success, false);
});
