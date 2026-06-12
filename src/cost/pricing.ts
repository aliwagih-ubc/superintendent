import type { TokenUsage } from './types.js';

interface ModelRate {
  inputPerMtok: number;
  outputPerMtok: number;
  cacheReadPerMtok: number;
  cacheWritePerMtok: number;
}

// List prices per million tokens (USD). MANUAL UPDATE POINT: revisit when Anthropic changes prices.
const RATES: Record<string, ModelRate> = {
  'claude-haiku-4-5':  { inputPerMtok: 1,  outputPerMtok: 5,  cacheReadPerMtok: 0.10, cacheWritePerMtok: 1.25 },
  'claude-sonnet-4-6': { inputPerMtok: 3,  outputPerMtok: 15, cacheReadPerMtok: 0.30, cacheWritePerMtok: 3.75 },
  'claude-opus-4-8':   { inputPerMtok: 15, outputPerMtok: 75, cacheReadPerMtok: 1.50, cacheWritePerMtok: 18.75 },
};

export function getRate(model: string): ModelRate | undefined {
  return RATES[model];
}

export function knownModels(): string[] {
  return Object.keys(RATES);
}

export function costForUsage(model: string, usage: TokenUsage): number | null {
  const rate = RATES[model];
  if (!rate) return null;
  const perToken = 1_000_000;
  const dollars =
    usage.inputTokens * rate.inputPerMtok +
    usage.outputTokens * rate.outputPerMtok +
    (usage.cacheReadTokens ?? 0) * rate.cacheReadPerMtok +
    (usage.cacheWriteTokens ?? 0) * rate.cacheWritePerMtok;
  return dollars / perToken;
}
