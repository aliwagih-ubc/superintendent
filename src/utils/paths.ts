import path from 'node:path';
import fs from 'node:fs';

/**
 * Centralized path management for Superintendent internal files.
 * All internal files are stored in .superintendent/ to reduce root-level clutter.
 *
 * Directory structure:
 * .superintendent/
 *   queue.db          - SQLite task queue database
 *   repo-summary.json - Repository context summary
 *   token.json        - OAuth token storage
 *   worktrees/        - Git worktrees for parallel execution
 *   cache/            - Temporary cache files
 */

const SUPERINTENDENT_DIR = '.superintendent';

/**
 * Get the root Superintendent directory path
 * Creates the directory if it doesn't exist
 */
export function getSuperintendentDir(workDir: string = process.cwd()): string {
  const dir = path.join(workDir, SUPERINTENDENT_DIR);
  ensureDir(dir);
  return dir;
}

/**
 * Get the queue database path
 * Default: .superintendent/queue.db
 */
export function getQueueDbPath(workDir: string = process.cwd()): string {
  return path.join(getSuperintendentDir(workDir), 'queue.db');
}

/**
 * Get the repository summary path
 * Default: .superintendent/repo-summary.json
 */
export function getRepoSummaryPath(workDir: string = process.cwd()): string {
  return path.join(getSuperintendentDir(workDir), 'repo-summary.json');
}

/**
 * Get the OAuth token storage path
 * Default: .superintendent/token.json
 */
export function getTokenPath(workDir: string = process.cwd()): string {
  return path.join(getSuperintendentDir(workDir), 'token.json');
}

/**
 * Get the worktrees directory path
 * Default: .superintendent/worktrees/
 */
export function getWorktreesDir(workDir: string = process.cwd()): string {
  const dir = path.join(getSuperintendentDir(workDir), 'worktrees');
  ensureDir(dir);
  return dir;
}

/**
 * Get the cache directory path
 * Default: .superintendent/cache/
 */
export function getCacheDir(workDir: string = process.cwd()): string {
  const dir = path.join(getSuperintendentDir(workDir), 'cache');
  ensureDir(dir);
  return dir;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Check if a legacy file exists and migrate it to the new location
 * Returns true if migration occurred
 */
export function migrateLegacyFile(
  legacyPath: string,
  newPath: string,
  options: { copy?: boolean } = {}
): boolean {
  if (fs.existsSync(legacyPath) && !fs.existsSync(newPath)) {
    // Ensure parent directory exists
    const parentDir = path.dirname(newPath);
    ensureDir(parentDir);

    if (options.copy) {
      fs.copyFileSync(legacyPath, newPath);
    } else {
      fs.renameSync(legacyPath, newPath);
    }
    return true;
  }
  return false;
}

/**
 * Get legacy database path (for migration)
 */
export function getLegacyQueueDbPath(workDir: string = process.cwd()): string {
  return path.join(workDir, '.superintendent-queue.db');
}

/**
 * Get legacy repo summary path (for migration)
 */
export function getLegacyRepoSummaryPath(workDir: string = process.cwd()): string {
  return path.join(workDir, '.superintendent-repo-summary.json');
}

/**
 * Get legacy token path (for migration)
 */
export function getLegacyTokenPath(workDir: string = process.cwd()): string {
  return path.join(workDir, '.superintendent-token.json');
}
