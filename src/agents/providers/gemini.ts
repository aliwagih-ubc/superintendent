import type { CodingProvider, ProviderParseResult, ProviderSpawn } from './types.js';

const PR_RE = /https:\/\/github\.com\/[^\s"]+\/pull\/\d+/;

export class GeminiProvider implements CodingProvider {
  readonly name = 'gemini' as const;

  buildSpawn(prompt: string, _worktreePath: string): ProviderSpawn {
    return { command: 'gemini', args: ['--yolo', '-p', prompt] };
  }

  parseOutput(raw: string, exitCode: number | null): ProviderParseResult {
    const prUrl = raw.match(PR_RE)?.[0];
    if (exitCode === 0) {
      return { success: true, prUrl };
    }
    return { success: false, prUrl, error: `Process exited with code ${exitCode}` };
  }
}

export const geminiProvider = new GeminiProvider();
