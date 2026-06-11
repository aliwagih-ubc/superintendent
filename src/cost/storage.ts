import type Database from 'better-sqlite3';
import type { CostEventInput } from './types.js';

type StoredEvent = CostEventInput & { costUsd: number | null };

export function insertCostEvent(db: Database.Database, e: StoredEvent): void {
  db.prepare(
    `INSERT INTO cost_events
      (ticket_id, ticket_identifier, ticket_title, session_id, agent_type, model, source,
       input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, developer)
     VALUES
      (@ticketId, @ticketIdentifier, @ticketTitle, @sessionId, @agentType, @model, @source,
       @inputTokens, @outputTokens, @cacheReadTokens, @cacheWriteTokens, @costUsd, @developer)`,
  ).run({
    ticketId: e.ticketId,
    ticketIdentifier: e.ticketIdentifier ?? null,
    ticketTitle: e.ticketTitle ?? null,
    sessionId: e.sessionId ?? null,
    agentType: e.agentType,
    model: e.model,
    source: e.source,
    inputTokens: e.usage?.inputTokens ?? null,
    outputTokens: e.usage?.outputTokens ?? null,
    cacheReadTokens: e.usage?.cacheReadTokens ?? null,
    cacheWriteTokens: e.usage?.cacheWriteTokens ?? null,
    costUsd: e.costUsd,
    developer: e.developer ?? null,
  });
}

export function totalCostUsd(db: Database.Database): number {
  const row = db.prepare('SELECT COALESCE(SUM(cost_usd), 0) AS total FROM cost_events').get() as { total: number };
  return row.total;
}

export function costByTicket(db: Database.Database): Array<{ ticketId: string; costUsd: number }> {
  return db.prepare(
    `SELECT ticket_id AS ticketId, COALESCE(SUM(cost_usd), 0) AS costUsd
     FROM cost_events GROUP BY ticket_id ORDER BY costUsd DESC`,
  ).all() as Array<{ ticketId: string; costUsd: number }>;
}
