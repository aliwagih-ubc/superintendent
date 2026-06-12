import { getDatabase } from '../queue/database.js';
import { createChildLogger } from '../utils/logger.js';
import { costForUsage } from './pricing.js';
import { insertCostEvent } from './storage.js';
import type { CostEventInput } from './types.js';
import { enqueue, isPublishingEnabled } from '../publisher/outbox.js';
import { linearCache } from '../linear/cache.js';

const logger = createChildLogger({ module: 'cost-recorder' });

/** The ticket's developer: its creator, falling back to assignee, from the cached ticket. */
function resolveDeveloper(ticketId: string): string | undefined {
  const ticket = linearCache.getTicket(ticketId);
  return ticket?.creator?.name || ticket?.assignee?.name || undefined;
}

export class CostRecorder {
  // Best-effort: a recording failure must never break an agent run.
  record(event: CostEventInput): void {
    try {
      let costUsd: number | null;
      if (event.costUsd !== undefined) {
        costUsd = event.costUsd;
      } else if (event.usage) {
        costUsd = costForUsage(event.model, event.usage);
      } else {
        costUsd = null;
      }

      if (costUsd === null) {
        logger.warn({ model: event.model, agentType: event.agentType }, 'No price for model; recording cost as null');
      }

      const developer = event.developer ?? resolveDeveloper(event.ticketId);
      const stored = { ...event, costUsd, developer };
      insertCostEvent(getDatabase(), stored);
      if (isPublishingEnabled()) {
        enqueue(getDatabase(), 'cost_events', {
          ticket_id: stored.ticketId,
          ticket_identifier: stored.ticketIdentifier ?? null,
          ticket_title: stored.ticketTitle ?? null,
          session_id: stored.sessionId ?? null,
          agent_type: stored.agentType,
          model: stored.model,
          source: stored.source,
          input_tokens: stored.usage?.inputTokens ?? null,
          output_tokens: stored.usage?.outputTokens ?? null,
          cache_read_tokens: stored.usage?.cacheReadTokens ?? null,
          cache_write_tokens: stored.usage?.cacheWriteTokens ?? null,
          cost_usd: costUsd,
          developer: stored.developer ?? null,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Failed to record cost event');
    }
  }
}

export const costRecorder = new CostRecorder();
