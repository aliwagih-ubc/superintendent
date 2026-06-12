import { execFileSync } from 'node:child_process';
import { createChildLogger } from '../../utils/logger.js';

const logger = createChildLogger({ module: 'git-files' });

/**
 * Files changed in `worktreePath` since `baseSha`: committed changes (baseSha..HEAD)
 * unioned with uncommitted working-tree changes. Best-effort: returns [] on failure.
 */
export function filesChangedSince(worktreePath: string, baseSha: string): string[] {
  try {
    // Tracked changes relative to the base: committed since baseSha plus uncommitted edits.
    const tracked = execFileSync('git', ['diff', '--name-only', baseSha], {
      cwd: worktreePath, encoding: 'utf-8',
    });
    // New files the provider created but did not commit.
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
      cwd: worktreePath, encoding: 'utf-8',
    });
    const set = new Set<string>();
    for (const line of `${tracked}\n${untracked}`.split('\n')) {
      const f = line.trim();
      if (f) set.add(f);
    }
    return [...set];
  } catch (err) {
    logger.warn({ err, worktreePath }, 'Could not compute changed files from git');
    return [];
  }
}
