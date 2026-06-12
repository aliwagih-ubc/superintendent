import type { TicketCostSummary } from '../../cost/storage.js';
import type { ReviewFinding } from '../../agents/core/index.js';

interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
}

export interface CompletionInput {
  prUrl?: string;
  filesModified: string[];
  testResults?: TestResults;
  cost: TicketCostSummary;
}

function num(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatCostSummary(cost: TicketCostSummary): string {
  const dollars = `$${cost.costUsd.toFixed(4)}`;
  const tokens = `${num(cost.inputTokens)} in, ${num(cost.outputTokens)} out`;
  const cache = cost.cacheReadTokens + cost.cacheWriteTokens > 0
    ? ` (${num(cost.cacheReadTokens)} cache read, ${num(cost.cacheWriteTokens)} cache write)`
    : '';
  return `Cost: ${dollars} across ${cost.eventCount} model call${cost.eventCount === 1 ? '' : 's'}. Tokens: ${tokens}${cache}.`;
}

export function planComment(planBody: string): string {
  return `## Implementation plan\n\n${planBody.trim()}`;
}

export function reviewRequestedComment(prUrl?: string): string {
  if (prUrl) {
    return `Work is up for review. Pull request: ${prUrl}`;
  }
  return 'Work is up for review.';
}

export function reviewSummaryComment(input: {
  blocking: ReviewFinding[];
  nonBlocking: ReviewFinding[];
  fixed: boolean;
}): string {
  const lines: string[] = ['## Self-review'];
  if (input.blocking.length === 0) {
    lines.push('No blocking issues found.');
  } else {
    const verb = input.fixed ? 'found and fixed' : 'found';
    lines.push(`${input.blocking.length} blocking issue${input.blocking.length === 1 ? '' : 's'} ${verb}:`);
    for (const f of input.blocking) {
      lines.push(`- ${f.file ? `${f.file}: ` : ''}${f.message}`);
    }
  }
  if (input.nonBlocking.length > 0) {
    lines.push(`Non-blocking notes (${input.nonBlocking.length}):`);
    for (const f of input.nonBlocking) {
      lines.push(`- ${f.file ? `${f.file}: ` : ''}${f.message}`);
    }
  }
  return lines.join('\n\n');
}

export function completionComment(input: CompletionInput): string {
  const lines: string[] = ['## Done'];
  if (input.prUrl) {
    lines.push(`Pull request: ${input.prUrl}`);
  }
  const fileCount = input.filesModified.length;
  lines.push(`Files changed: ${fileCount} file${fileCount === 1 ? '' : 's'}.`);
  if (input.testResults) {
    const t = input.testResults;
    lines.push(`Tests: ${t.passed} passed, ${t.failed} failed, ${t.skipped} skipped.`);
  }
  lines.push(formatCostSummary(input.cost));
  return lines.join('\n\n');
}
