import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { filesChangedSince } from '../../../src/agents/providers/git-files.js';

let dir: string;
const git = (args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf-8' });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitfiles-'));
  git(['init', '-q']);
  git(['config', 'user.email', 't@t.com']);
  git(['config', 'user.name', 'T']);
  fs.writeFileSync(path.join(dir, 'a.txt'), 'one');
  git(['add', '.']);
  git(['commit', '-qm', 'base']);
});

afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

test('lists files changed across commits since a base SHA', () => {
  const base = git(['rev-parse', 'HEAD']).trim();
  fs.writeFileSync(path.join(dir, 'a.txt'), 'two');
  fs.writeFileSync(path.join(dir, 'b.txt'), 'new');
  git(['add', '.']);
  git(['commit', '-qm', 'change']);
  const files = filesChangedSince(dir, base).sort();
  assert.deepEqual(files, ['a.txt', 'b.txt']);
});

test('includes uncommitted working-tree changes', () => {
  const base = git(['rev-parse', 'HEAD']).trim();
  fs.writeFileSync(path.join(dir, 'c.txt'), 'uncommitted');
  const files = filesChangedSince(dir, base);
  assert.ok(files.includes('c.txt'));
});

test('returns an empty array on git failure (bad base)', () => {
  assert.deepEqual(filesChangedSince(dir, 'not-a-sha'), []);
});
