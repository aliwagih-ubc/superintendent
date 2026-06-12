export interface SnapshotTicket {
  id: string;
  identifier: string;
  title: string | null;
  state: string;
  readiness_score: number | null;
  pr_url: string | null;
  developer: string | null;
  updated_at: string;
}

export interface SnapshotSession {
  session_id: string;
  ticket_id: string;
  agent_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  pr_url: string | null;
}

export interface Heartbeat {
  id: number;
  last_seen: string;
  version: string;
  poll_interval_seconds: number;
  slots_total: number;
  slots_used: number;
}

export interface Snapshot {
  tickets: SnapshotTicket[];
  sessions: SnapshotSession[];
  heartbeat: Heartbeat;
}
