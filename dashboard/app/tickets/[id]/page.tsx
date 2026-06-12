'use client';
import { useParams } from 'next/navigation';
import Shell from '@/components/Shell';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { sumBy } from '@/lib/aggregate';
import type { Ticket, Session, CostEvent } from '@/lib/types';

const TABLES = ['tickets', 'sessions', 'cost_events'];

interface DetailData {
  ticket: Ticket | null;
  sessions: Session[];
  costEvents: CostEvent[];
}

function usd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '-';
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, loading } = useLiveQuery<DetailData>(async (sb) => {
    const [ticket, sessions, costEvents] = await Promise.all([
      sb.from('tickets').select('*').eq('id', id).maybeSingle(),
      sb.from('sessions').select('*').eq('ticket_id', id).order('started_at', { ascending: false }),
      sb.from('cost_events').select('*').eq('ticket_id', id).order('created_at', { ascending: false }),
    ]);
    return {
      ticket: (ticket.data as Ticket | null) ?? null,
      sessions: (sessions.data as Session[]) ?? [],
      costEvents: (costEvents.data as CostEvent[]) ?? [],
    };
  }, TABLES);

  if (loading) {
    return (
      <Shell>
        <p className="text-[var(--color-muted)] text-sm">Loading.</p>
      </Shell>
    );
  }

  const ticket = data?.ticket ?? null;
  if (!ticket) {
    return (
      <Shell>
        <p className="text-[var(--color-muted)] text-sm">Ticket not found or not yet published.</p>
      </Shell>
    );
  }

  const sessions = data?.sessions ?? [];
  const costEvents = data?.costEvents ?? [];
  const total = sumBy(costEvents);

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-accent)] font-bold">{ticket.identifier}</span>
            <span className="text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-muted)]">
              {ticket.state}
            </span>
            {ticket.pr_url ? (
              <a href={ticket.pr_url} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] text-sm hover:underline">
                PR
              </a>
            ) : null}
          </div>
          <h1 className="text-lg font-bold">{ticket.title ?? 'Untitled'}</h1>
          <div className="text-[var(--color-muted)] text-sm">Total cost {usd(total)}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[var(--color-muted)] text-xs uppercase tracking-wider">Sessions</div>
          {sessions.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">No sessions.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-muted)] text-xs uppercase tracking-wider text-left">
                  <th className="py-2 pr-2 font-medium">Agent</th>
                  <th className="py-2 pr-2 font-medium">Status</th>
                  <th className="py-2 pr-2 font-medium">Started</th>
                  <th className="py-2 font-medium">Ended</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.session_id} className="border-t border-[var(--color-border)]">
                    <td className="py-2 pr-2">{s.agent_type}</td>
                    <td className="py-2 pr-2">{s.status}</td>
                    <td className="py-2 pr-2 text-[var(--color-muted)]">{fmt(s.started_at)}</td>
                    <td className="py-2 text-[var(--color-muted)]">{fmt(s.ended_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[var(--color-muted)] text-xs uppercase tracking-wider">Cost events</div>
          {costEvents.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">No cost events.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-muted)] text-xs uppercase tracking-wider text-left">
                  <th className="py-2 pr-2 font-medium">Model</th>
                  <th className="py-2 pr-2 font-medium">Source</th>
                  <th className="py-2 pr-2 font-medium">When</th>
                  <th className="py-2 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {costEvents.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--color-border)]">
                    <td className="py-2 pr-2">{c.model}</td>
                    <td className="py-2 pr-2 text-[var(--color-muted)]">{c.source}</td>
                    <td className="py-2 pr-2 text-[var(--color-muted)]">{fmt(c.created_at)}</td>
                    <td className="py-2 text-right tabular-nums">{usd(c.cost_usd ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  );
}
