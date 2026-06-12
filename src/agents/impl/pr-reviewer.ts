import {
  BaseAgent,
  type AgentConfig,
  type AgentInput,
  type AgentOutput,
  PrReviewerInputSchema,
  PrReviewerOutputSchema,
  type PrReviewerInput,
  type PrReviewerOutput,
  type ReviewFinding,
} from '../core/index.js';

export interface FindingSummary {
  blocking: ReviewFinding[];
  nonBlocking: ReviewFinding[];
  hasBlockers: boolean;
}

export function summarizeFindings(findings: ReviewFinding[]): FindingSummary {
  const blocking = findings.filter((f) => f.severity === 'blocking');
  const nonBlocking = findings.filter((f) => f.severity === 'non_blocking');
  return { blocking, nonBlocking, hasBlockers: blocking.length > 0 };
}

const SYSTEM_PROMPT = `You are reviewing a pull request diff produced by a coding agent for a Linear ticket.
Find real problems only. Classify each finding:
- "blocking": a correctness bug, a build break, or a failing or again-needed test. Something that should be fixed before merge.
- "non_blocking": style, naming, minor cleanups, or suggestions.
Do not invent issues. If the diff is fine, return an empty findings array.
Return JSON: { "findings": [ { "severity": "blocking|non_blocking", "file": "optional/path", "message": "what and why" } ] }.`;

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocking', 'non_blocking'] },
          file: { type: 'string' },
          message: { type: 'string' },
        },
        required: ['severity', 'message'],
      },
    },
  },
  required: ['findings'],
};

const MAX_DIFF_CHARS = 60000;

export class PrReviewerAgent extends BaseAgent<PrReviewerInput, PrReviewerOutput> {
  readonly config: AgentConfig = {
    type: 'pr-reviewer',
    name: 'PrReviewer',
    description: 'Reviews a PR diff and classifies findings',
    modelTier: 'standard',
    cacheable: false,
    timeoutMs: 60000,
  };

  readonly inputSchema = PrReviewerInputSchema;
  readonly outputSchema = PrReviewerOutputSchema;

  async execute(input: AgentInput<PrReviewerInput>): Promise<AgentOutput<PrReviewerOutput>> {
    const startTime = Date.now();
    const { title, description, diff } = input.data;
    const clipped = diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}\n... (diff truncated)` : diff;
    const userPrompt = `Ticket: ${input.data.ticketIdentifier} ${title}\n\n${description}\n\n## Diff\n${clipped}`;
    try {
      const result = await this.callClaude<PrReviewerOutput>(
        SYSTEM_PROMPT,
        userPrompt,
        FINDINGS_SCHEMA,
        { maxTokens: 2048 },
        { ticketId: input.ticketId, ticketIdentifier: input.ticketIdentifier },
      );
      return this.createSuccessOutput(
        { findings: result.findings ?? [] },
        { durationMs: Date.now() - startTime, cached: false },
      );
    } catch (error) {
      return this.createErrorOutput(error instanceof Error ? error : String(error), {
        durationMs: Date.now() - startTime,
      });
    }
  }
}

export const prReviewerAgent = new PrReviewerAgent();
