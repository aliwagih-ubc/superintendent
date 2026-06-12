export interface CostEvent {
  id: number;
  ticket_id: string;
  ticket_identifier: string | null;
  ticket_title: string | null;
  session_id: string | null;
  agent_type: string;
  model: string;
  source: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_tokens: number | null;
  cache_write_tokens: number | null;
  cost_usd: number | null;
  developer: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  identifier: string;
  title: string | null;
  state: string;
  readiness_score: number | null;
  pr_url: string | null;
  developer: string | null;
  updated_at: string;
}

export interface Session {
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
