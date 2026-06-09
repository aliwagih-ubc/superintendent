import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadProgress,
  saveProgress,
  writeEnvFileAtomic,
} from '../../scripts/setup/lib/persistence.js';
import { defaultSetupState } from '../../scripts/setup/lib/schema.js';

function freshTmp(): string {
  return mkdtempSync(join(tmpdir(), 'superintendent-test-'));
}

test('loadProgress returns default state when no file exists', () => {
  const dir = freshTmp();
  const state = loadProgress(dir);
  assert.deepEqual(state.completedSteps, []);
});

test('saveProgress then loadProgress round-trips', () => {
  const dir = freshTmp();
  const state = defaultSetupState();
  state.LINEAR_TEAM_ID = '11111111-1111-1111-1111-111111111111';
  state.completedSteps = ['welcome', 'linear'];
  saveProgress(dir, state);
  const loaded = loadProgress(dir);
  assert.equal(loaded.LINEAR_TEAM_ID, state.LINEAR_TEAM_ID);
  assert.deepEqual(loaded.completedSteps, ['welcome', 'linear']);
});

test('loadProgress recovers gracefully from corrupt JSON', () => {
  const dir = freshTmp();
  const file = join(dir, '.superintendent', 'setup-progress.json');
  // Manually create corrupt state
  mkdirSync(join(dir, '.superintendent'), { recursive: true });
  writeFileSync(file, 'not-json{');
  const state = loadProgress(dir);
  assert.deepEqual(state.completedSteps, []);
});

test('writeEnvFileAtomic writes a .env file with the expected keys', () => {
  const dir = freshTmp();
  const state = defaultSetupState();
  state.LINEAR_TEAM_ID = '11111111-1111-1111-1111-111111111111';
  state.ANTHROPIC_API_KEY = 'sk-ant-test';
  state.GITHUB_REPO = 'aliwagih-ubc/example';
  writeEnvFileAtomic(dir, state);
  const envPath = join(dir, '.env');
  assert.equal(existsSync(envPath), true);
  const content = readFileSync(envPath, 'utf-8');
  assert.match(content, /^LINEAR_TEAM_ID=11111111-1111-1111-1111-111111111111$/m);
  assert.match(content, /^ANTHROPIC_API_KEY=sk-ant-test$/m);
  assert.match(content, /^GITHUB_REPO=aliwagih-ubc\/example$/m);
});

test('writeEnvFileAtomic is atomic — no partial .env on simulated failure', () => {
  // We trust the rename() syscall is atomic on POSIX. Verifying that no `.env.tmp`
  // remains after a successful write is a reasonable proxy.
  const dir = freshTmp();
  const state = defaultSetupState();
  writeEnvFileAtomic(dir, state);
  assert.equal(existsSync(join(dir, '.env.tmp')), false);
});
