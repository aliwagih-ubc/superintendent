import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeFindings } from '../../src/agents/impl/pr-reviewer.js';
import type { ReviewFinding } from '../../src/agents/core/index.js';

const f = (severity: 'blocking' | 'non_blocking', message: string): ReviewFinding => ({ severity, message });

test('summarizeFindings splits and counts by severity', () => {
  const s = summarizeFindings([
    f('blocking', 'null deref'),
    f('non_blocking', 'rename var'),
    f('blocking', 'build breaks'),
  ]);
  assert.equal(s.blocking.length, 2);
  assert.equal(s.nonBlocking.length, 1);
  assert.equal(s.hasBlockers, true);
});

test('summarizeFindings reports no blockers on an empty or clean list', () => {
  assert.equal(summarizeFindings([]).hasBlockers, false);
  assert.equal(summarizeFindings([f('non_blocking', 'style')]).hasBlockers, false);
});
