export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export type CostSource = 'sdk' | 'claude_code';

export interface CostEventInput {
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle?: string;
  sessionId?: string;
  agentType: string;
  model: string;
  source: CostSource;
  usage?: TokenUsage;
  // When provided (Claude Code), used directly. When absent (SDK), computed from usage + pricing.
  costUsd?: number;
  developer?: string;
}
