import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCostSummary,
  planComment,
  reviewRequestedComment,
  completionComment,
  reviewSummaryComment,
} from '../../src/linear/comments/templates.js';
import type { TicketCostSummary } from '../../src/cost/storage.js';

const summary: TicketCostSummary = {
  costUsd: 1.2345, inputTokens: 1000, outputTokens: 500,
  cacheReadTokens: 200, cacheWriteTokens: 100, eventCount: 3,
};

test('formatCostSummary shows dollars and token totals, no em-dash', () => {
  const out = formatCostSummary(summary);
  assert.match(out, /\$1\.2345/);
  assert.match(out, /1,000 in/);
  assert.match(out, /500 out/);
  assert.equal(out.includes('—'), false);
});

test('formatCostSummary handles a zero/empty summary', () => {
  const out = formatCostSummary({
    costUsd: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, eventCount: 0,
  });
  assert.match(out, /\$0\.0000/);
});

test('planComment includes the plan body under a heading', () => {
  const out = planComment('Step 1. Do the thing.');
  assert.match(out, /Implementation plan/i);
  assert.match(out, /Step 1\. Do the thing\./);
  assert.equal(out.includes('—'), false);
});

test('reviewRequestedComment links the PR when present', () => {
  assert.match(reviewRequestedComment('https://github.com/o/r/pull/7'), /pull\/7/);
});

test('completionComment includes PR, file count, tests, and cost', () => {
  const out = completionComment({
    prUrl: 'https://github.com/o/r/pull/7',
    filesModified: ['a.ts', 'b.ts'],
    testResults: { passed: 4, failed: 0, skipped: 1 },
    cost: summary,
  });
  assert.match(out, /pull\/7/);
  assert.match(out, /2 files/);
  assert.match(out, /4 passed/);
  assert.match(out, /\$1\.2345/);
  assert.equal(out.includes('—'), false);
});

test('completionComment omits PR and tests lines when absent', () => {
  const out = completionComment({ filesModified: [], cost: summary });
  assert.equal(out.includes('Pull request'), false);
  assert.equal(out.includes('Tests'), false);
  assert.match(out, /\$1\.2345/);
});

test('reviewSummaryComment states blockers fixed and lists non-blocking findings', () => {
  const out = reviewSummaryComment({
    blocking: [{ severity: 'blocking', message: 'null deref in foo.ts' }],
    nonBlocking: [{ severity: 'non_blocking', message: 'rename x to count' }],
    fixed: true,
  });
  assert.match(out, /1 blocking/);
  assert.match(out, /fixed/i);
  assert.match(out, /rename x to count/);
  assert.equal(out.includes('—'), false);
});

test('reviewSummaryComment handles a clean review', () => {
  const out = reviewSummaryComment({ blocking: [], nonBlocking: [], fixed: false });
  assert.match(out, /No blocking issues/i);
});
