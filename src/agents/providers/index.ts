import type { CodingProvider, ProviderName } from './types.js';
import { claudeCodeProvider } from './claude-code.js';
import { geminiProvider } from './gemini.js';
import { codexProvider } from './codex.js';

const providers: Record<ProviderName, CodingProvider> = {
  'claude-code': claudeCodeProvider,
  gemini: geminiProvider,
  codex: codexProvider,
};

export function getProvider(name: ProviderName): CodingProvider {
  return providers[name];
}

export { resolveProviderName } from './registry.js';
export type { CodingProvider, ProviderName } from './types.js';
