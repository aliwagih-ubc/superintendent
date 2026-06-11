import { getDatabase } from '../queue/database.js';
import { sessionStorage } from '../sessions/index.js';
import type { Snapshot, SnapshotTicket, SnapshotSession, Heartbeat } from './types.js';

export function deriveTicketState(status: string, taskType: string): string {
  if (status === 'completed') return 'done';
  if (status === 'failed') return 'failed';
  if (status === 'processing') {
    if (taskType === 'refinement') return 'refining';
    if (taskType === 'planning') return 'planning';
    return 'working';
  }
  return 'queued';
}

interface QueueRow {
  ticket_id: string;
  ticket_identifier: string;
  task_type: string;
  status: string;
  readiness_score: number | null;
  updated_at: string;
}

export function buildSnapshot(opts: {
  version: string;
  pollIntervalSeconds: number;
  slotsTotal: number;
  slotsUsed: number;
}): Snapshot {
  const db = getDatabase();
  const rows = db.prepare(
    `SELECT ticket_id, ticket_identifier, task_type, status, readiness_score, updated_at
     FROM linear_ticket_queue`,
  ).all() as QueueRow[];

  const tickets: SnapshotTicket[] = rows.map((r) => {
    const pr = db.prepare('SELECT pr_url FROM claude_code_queue WHERE ticket_id = ? AND pr_url IS NOT NULL LIMIT 1')
      .get(r.ticket_id) as { pr_url: string } | undefined;
    return {
      id: r.ticket_id,
      identifier: r.ticket_identifier,
      title: null,
      state: deriveTicketState(r.status, r.task_type),
      readiness_score: r.readiness_score,
      pr_url: pr?.pr_url ?? null,
      developer: null,
      updated_at: r.updated_at,
    };
  });

  const active = sessionStorage.listByStatus('active', 100);
  const sessions: SnapshotSession[] = active
    .filter((s) => s.agentSessionId)
    .map((s) => ({
      session_id: s.agentSessionId as string,
      ticket_id: s.ticketId,
      agent_type: 'code-executor',
      status: s.status,
      started_at: s.createdAt.toISOString(),
      ended_at: s.completedAt ? s.completedAt.toISOString() : null,
      pr_url: null,
    }));

  const heartbeat: Heartbeat = {
    id: 1,
    last_seen: new Date().toISOString(),
    version: opts.version,
    poll_interval_seconds: opts.pollIntervalSeconds,
    slots_total: opts.slotsTotal,
    slots_used: opts.slotsUsed,
  };

  return { tickets, sessions, heartbeat };
}
