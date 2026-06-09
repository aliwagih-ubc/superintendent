import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRepoPath } from '../../scripts/setup/lib/validate.js';

function freshTmp(): string {
  return mkdtempSync(join(tmpdir(), 'superintendent-repo-'));
}

test('validateRepoPath returns ok for a git repo with a GitHub remote', () => {
  const dir = freshTmp();
  execSync('git init -q', { cwd: dir });
  execSync('git remote add origin https://github.com/aliwagih-ubc/example.git', { cwd: dir });
  const result = validateRepoPath(dir);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.githubRepo, 'aliwagih-ubc/example');
});

test('validateRepoPath returns error for a non-existent path', () => {
  const result = validateRepoPath('/totally/does/not/exist/anywhere');
  assert.equal(result.ok, false);
});

test('validateRepoPath returns error for a directory that is not a git repo', () => {
  const dir = freshTmp();
  mkdirSync(join(dir, 'not-a-repo'));
  const result = validateRepoPath(join(dir, 'not-a-repo'));
  assert.equal(result.ok, false);
});

test('validateRepoPath returns error when origin is not GitHub', () => {
  const dir = freshTmp();
  execSync('git init -q', { cwd: dir });
  execSync('git remote add origin https://gitlab.com/foo/bar.git', { cwd: dir });
  const result = validateRepoPath(dir);
  assert.equal(result.ok, false);
});
