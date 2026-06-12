import type { CodeExecutorOutput } from '../core/index.js';

export type ProviderName = 'claude-code' | 'gemini' | 'codex';

export const PROVIDER_NAMES: ProviderName[] = ['claude-code', 'gemini', 'codex'];

export interface ProviderSpawn {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ProviderParseResult {
  success: boolean;
  prUrl?: string;
  commitSha?: string;
  costUsd?: number;
  sessionId?: string;
  testResults?: { passed: number; failed: number; skipped: number };
  error?: string;
}

export interface CodingProvider {
  readonly name: ProviderName;
  /** Build the spawn command for a fresh run of `prompt` inside `worktreePath`. */
  buildSpawn(prompt: string, worktreePath: string): ProviderSpawn;
  /** Parse the provider's accumulated stdout+stderr into a normalized result. */
  parseOutput(raw: string, exitCode: number | null): ProviderParseResult;
}

/** A provider's contribution to the final CodeExecutorOutput, minus filesModified (the runner derives that from git). */
export type ProviderOutput = Omit<CodeExecutorOutput, 'filesModified' | 'output'>;
