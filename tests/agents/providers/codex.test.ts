import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codexProvider } from '../../../src/agents/providers/codex.js';

test('name is codex', () => {
  assert.equal(codexProvider.name, 'codex');
});

test('buildSpawn runs codex exec non-interactively with the prompt', () => {
  const s = codexProvider.buildSpawn('ship it', '/tmp/wt');
  assert.equal(s.command, 'codex');
  assert.ok(s.args.includes('exec'));
  assert.ok(s.args.includes('ship it'));
});

test('parseOutput extracts the PR url on exit 0', () => {
  const r = codexProvider.parseOutput('PR: https://github.com/o/r/pull/12', 0);
  assert.equal(r.success, true);
  assert.equal(r.prUrl, 'https://github.com/o/r/pull/12');
});

test('parseOutput fails on nonzero exit', () => {
  const r = codexProvider.parseOutput('nope', 1);
  assert.equal(r.success, false);
  assert.match(r.error ?? '', /code 1/);
});
