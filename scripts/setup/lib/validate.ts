import { LinearClient } from '@linear/sdk';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import type { SetupState } from './schema.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ValidationResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

type LinearClientBuilder = (apiKey: string) => LinearClient;

const defaultLinearClient: LinearClientBuilder = (apiKey) =>
  new LinearClient({ apiKey });

export async function validateLinearToken(
  apiKey: string,
  build: LinearClientBuilder = defaultLinearClient,
): Promise<ValidationResult<{ workspaceName: string }>> {
  if (!apiKey || apiKey.trim() === '') {
    return { ok: false, error: 'Empty token.' };
  }
  try {
    const client = build(apiKey);
    const viewer = await client.viewer;
    const org = await (viewer as any).organization;
    return { ok: true, workspaceName: org?.urlKey ?? org?.name ?? '(unknown)' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type LinearTeam = { id: string; key: string; name: string };

export async function listLinearTeams(
  apiKey: string,
  build: LinearClientBuilder = defaultLinearClient,
): Promise<ValidationResult<{ teams: LinearTeam[] }>> {
  try {
    const client = build(apiKey);
    const connection = await client.teams();
    const teams: LinearTeam[] = (connection.nodes ?? []).map((t: any) => ({
      id: t.id,
      key: t.key,
      name: t.name,
    }));
    return { ok: true, teams };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

type AnthropicClientBuilder = (apiKey: string) => Anthropic;
const defaultAnthropicClient: AnthropicClientBuilder = (apiKey) => new Anthropic({ apiKey });

export async function validateAnthropicKey(
  apiKey: string,
  model: string,
  build: AnthropicClientBuilder = defaultAnthropicClient,
): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { ok: false, error: 'Empty key.' };
  }
  try {
    const client = build(apiKey);
    await client.messages.create({
      model,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function validateRepoPath(path: string): ValidationResult<{ githubRepo: string }> {
  if (!path) return { ok: false, error: 'Empty path.' };
  if (!existsSync(path)) return { ok: false, error: `Path does not exist: ${path}` };
  if (!statSync(path).isDirectory()) return { ok: false, error: `Not a directory: ${path}` };

  try {
    execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: path, stdio: 'pipe' });
  } catch {
    return { ok: false, error: 'Not a git repository.' };
  }

  let remoteUrl: string;
  try {
    remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: path, stdio: 'pipe' })
      .toString().trim();
  } catch {
    return { ok: false, error: 'No `origin` remote configured.' };
  }

  // Match both https://github.com/owner/repo[.git] and git@github.com:owner/repo[.git]
  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    return { ok: false, error: `origin is not on GitHub: ${remoteUrl}` };
  }
  return { ok: true, githubRepo: `${match[1]}/${match[2]}` };
}

export type AllChecks = {
  linear: ValidationResult<{ workspaceName?: string }>;
  anthropic: ValidationResult;
  repo: ValidationResult<{ githubRepo?: string }>;
};

export async function runAllChecks(
  state: SetupState,
  builders: {
    linearBuilder?: LinearClientBuilder;
    anthropicBuilder?: AnthropicClientBuilder;
  } = {},
): Promise<AllChecks> {
  const linear = await validateLinearToken(
    state.LINEAR_PERSONAL_TOKEN ?? '',
    builders.linearBuilder,
  );
  const anthropic = await validateAnthropicKey(
    state.ANTHROPIC_API_KEY ?? '',
    state.ANTHROPIC_MODEL,
    builders.anthropicBuilder,
  );
  const repo = validateRepoPath(state.AGENTS_WORK_DIR ?? '');
  return { linear, anthropic, repo };
}
