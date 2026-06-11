import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { BaseAgent } from '../../src/agents/core/base-agent.js';
import { costRecorder } from '../../src/cost/recorder.js';
import type { AgentConfig, AgentOutput } from '../../src/agents/core/types.js';
import type { CostEventInput } from '../../src/cost/types.js';

class ProbeAgent extends BaseAgent<unknown, { ok: boolean }> {
  readonly config: AgentConfig = {
    type: 'readiness-scorer', name: 'Probe', description: '', modelTier: 'standard', cacheable: false,
  };
  readonly inputSchema = z.any();
  readonly outputSchema = z.object({ ok: z.boolean() });
  async execute(): Promise<AgentOutput<{ ok: boolean }>> { return { success: true }; }
  callPublic(ctx: { ticketId: string; ticketIdentifier: string }) {
    return this.callClaude<{ ok: boolean }>(
      'sys', 'msg',
      { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false },
      undefined,
      ctx,
    );
  }
}

test('callClaude records an sdk cost event with the call usage', async () => {
  const agent = new ProbeAgent();
  // Stub the Anthropic client used inside callClaude.
  (agent as unknown as { client: unknown }).client = {
    beta: { messages: { create: async () => ({
      content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
      usage: { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 50, cache_creation_input_tokens: null },
    }) } },
  };
  // Capture recorder calls.
  const recorded: CostEventInput[] = [];
  const original = costRecorder.record;
  costRecorder.record = (e) => { recorded.push(e); };
  try {
    const result = await agent.callPublic({ ticketId: 't1', ticketIdentifier: 'ENG-1' });
    assert.deepEqual(result, { ok: true });
    assert.equal(recorded.length, 1);
    const e = recorded[0]!;
    assert.equal(e.source, 'sdk');
    assert.equal(e.agentType, 'readiness-scorer');
    assert.equal(e.model, 'claude-sonnet-4-6');
    assert.equal(e.ticketId, 't1');
    assert.deepEqual(e.usage, { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 50, cacheWriteTokens: undefined });
  } finally {
    costRecorder.record = original;
  }
});
