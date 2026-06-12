import { execSync } from 'node:child_process';
import type { CodingProvider, ProviderParseResult, ProviderSpawn } from './types.js';

function findClaudePath(): string {
  try {
    const p = execSync('which claude', { encoding: 'utf-8' }).trim();
    if (p) return p;
  } catch {
    // fall through to npx
  }
  return 'npx';
}

const CLAUDE_PATH = findClaudePath();
const USE_NPX = CLAUDE_PATH === 'npx';

function extractCostUsd(parsed: Record<string, unknown>): number | undefined {
  const v = parsed['total_cost_usd'];
  return typeof v === 'number' ? v : undefined;
}

function extractFromJsonResult(parsed: Record<string, unknown>, raw: string): ProviderParseResult {
  const result = parsed.result as string | undefined;
  const errorMsg = parsed.error as string | undefined;
  const isError = parsed.is_error as boolean | undefined;
  const prMatch = (result || raw).match(/https:\/\/github\.com\/[^\s"]+\/pull\/\d+/);
  const commitMatch = (result || raw).match(/commit ([a-f0-9]{40})/i);
  const success = !isError && !errorMsg && !result?.includes('TASK_FAILED');
  return {
    success,
    prUrl: prMatch?.[0],
    commitSha: commitMatch?.[1],
    costUsd: extractCostUsd(parsed),
    error: errorMsg || (isError ? 'Task failed' : undefined),
  };
}

function tryParseJsonOutput(raw: string): ProviderParseResult | null {
  const lines = raw.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]?.trim();
    if (line?.startsWith('{')) {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        if ('result' in parsed || 'error' in parsed || 'sessionId' in parsed) {
          return extractFromJsonResult(parsed, raw);
        }
      } catch {
        // keep scanning
      }
    }
  }
  if (raw.trim().startsWith('{')) {
    try {
      return extractFromJsonResult(JSON.parse(raw.trim()) as Record<string, unknown>, raw);
    } catch {
      return null;
    }
  }
  return null;
}

export class ClaudeCodeProvider implements CodingProvider {
  readonly name = 'claude-code' as const;

  buildSpawn(prompt: string, _worktreePath: string): ProviderSpawn {
    const baseArgs = [
      '-p', prompt,
      '--dangerously-skip-permissions',
      '--output-format', 'stream-json',
      '--verbose',
    ];
    const args = USE_NPX ? ['@anthropic-ai/claude-code', ...baseArgs] : baseArgs;
    return { command: CLAUDE_PATH, args, env: { CLAUDE_FLOW_NON_INTERACTIVE: 'true' } };
  }

  parseOutput(raw: string, exitCode: number | null): ProviderParseResult {
    const json = tryParseJsonOutput(raw);
    if (json) return json;

    const prMatch = raw.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
    const commitMatch = raw.match(/commit ([a-f0-9]{40})/i);
    const taskFailed = raw.includes('TASK_FAILED');
    if (exitCode === 0 && !taskFailed) {
      return { success: true, prUrl: prMatch?.[0], commitSha: commitMatch?.[1] };
    }
    const failedMatch = raw.match(/TASK_FAILED[:\s]*(.+?)(?:\n|$)/);
    return {
      success: false,
      prUrl: prMatch?.[0],
      commitSha: commitMatch?.[1],
      error: taskFailed ? (failedMatch?.[1] || 'Task marked as failed by agent') : `Process exited with code ${exitCode}`,
    };
  }
}

export const claudeCodeProvider = new ClaudeCodeProvider();
