#!/usr/bin/env tsx
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runAllChecks } from './setup/lib/validate.js';
import { defaultSetupState } from './setup/lib/schema.js';

function parseEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

async function main() {
  const cwd = process.cwd();
  const envPath = join(cwd, '.env');
  if (!existsSync(envPath)) {
    console.error('No .env found. Run `npm run setup` first.');
    process.exit(2);
  }

  const env = parseEnvFile(envPath);
  const state = defaultSetupState();
  state.LINEAR_PERSONAL_TOKEN = env.LINEAR_PERSONAL_TOKEN ?? env.LINEAR_CLIENT_SECRET ?? '';
  state.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY ?? '';
  state.ANTHROPIC_MODEL = env.ANTHROPIC_MODEL ?? state.ANTHROPIC_MODEL;
  state.AGENTS_WORK_DIR = env.AGENTS_WORK_DIR ?? '';

  console.log('Superintendent doctor');
  console.log('Running checks...\n');

  const checks = await runAllChecks(state);

  const line = (label: string, r: { ok: boolean; error?: string }, extra?: string) => {
    if (r.ok) {
      console.log(`  \x1b[32m✓\x1b[0m ${label}${extra ? ` (${extra})` : ''}`);
    } else {
      console.log(`  \x1b[31m✗\x1b[0m ${label}: ${r.error}`);
    }
  };

  line('Linear token + workspace', checks.linear, (checks.linear as any).workspaceName);
  line('Anthropic API key', checks.anthropic);
  line('Target repository', checks.repo, (checks.repo as any).githubRepo);

  const allOk = checks.linear.ok && checks.anthropic.ok && checks.repo.ok;
  console.log('');
  if (allOk) {
    console.log('\x1b[32mAll checks passed.\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31mOne or more checks failed.\x1b[0m');
    console.log('Re-run `npm run setup` to fix, or edit .env manually.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('doctor crashed:', err);
  process.exit(99);
});
