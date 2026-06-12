import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiProvider } from '../../../src/agents/providers/gemini.js';

test('name is gemini', () => {
  assert.equal(geminiProvider.name, 'gemini');
});

test('buildSpawn runs the gemini CLI with the prompt and auto-approval', () => {
  const s = geminiProvider.buildSpawn('build it', '/tmp/wt');
  assert.equal(s.command, 'gemini');
  assert.ok(s.args.includes('build it'));
  assert.ok(s.args.includes('--yolo'));
});

test('parseOutput extracts the PR url from plain stdout on exit 0', () => {
  const r = geminiProvider.parseOutput('... opened https://github.com/o/r/pull/3 ...', 0);
  assert.equal(r.success, true);
  assert.equal(r.prUrl, 'https://github.com/o/r/pull/3');
  assert.equal(r.costUsd, undefined);
});

test('parseOutput fails on nonzero exit', () => {
  const r = geminiProvider.parseOutput('error text', 2);
  assert.equal(r.success, false);
  assert.match(r.error ?? '', /code 2/);
});
