'use client';
import Shell from '@/components/Shell';
import StatCard from '@/components/StatCard';
import TicketRow from '@/components/TicketRow';
import { useLiveQuery } from '@/lib/useLiveQuery';
import type { Ticket, Session, Heartbeat } from '@/lib/types';

const TABLES = ['tickets', 'sessions', 'daemon_heartbeat'];

interface NowData {
  tickets: Ticket[];
  sessions: Session[];
  heartbeat: Heartbeat | null;
}

function minutesAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function NowPage() {
  const { data, loading } = useLiveQuery<NowData>(async (sb) => {
    const [tickets, sessions, heartbeat] = await Promise.all([
      sb.from('tickets').select('*').not('state', 'in', '(done,failed)').order('updated_at', { ascending: false }),
      sb.from('sessions').select('*').is('ended_at', null),
      sb.from('daemon_heartbeat').select('*').maybeSingle(),
    ]);
    return {
      tickets: (tickets.data as Ticket[]) ?? [],
      sessions: (sessions.data as Session[]) ?? [],
      heartbeat: (heartbeat.data as Heartbeat | null) ?? null,
    };
  }, TABLES);

  const hb = data?.heartbeat ?? null;
  const staleAfter = hb ? hb.poll_interval_seconds * 2 : 0;
  const secondsSinceSeen = hb ? (Date.now() - new Date(hb.last_seen).getTime()) / 1000 : Infinity;
  const online = hb !== null && secondsSinceSeen <= staleAfter;

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-bold">Now</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Daemon"
            value={hb === null ? 'no data' : online ? 'online' : 'offline'}
            sub={hb ? `last seen ${minutesAgo(hb.last_seen)}m ago` : undefined}
            tone={hb === null ? 'default' : online ? 'good' : 'bad'}
          />
          <StatCard
            label="Slots"
            value={hb ? `${hb.slots_used} / ${hb.slots_total}` : '-'}
            sub={hb ? `${hb.poll_interval_seconds}s poll` : undefined}
          />
          <StatCard
            label="In flight"
            value={loading ? '...' : String(data?.tickets.length ?? 0)}
            sub={data ? `${data.sessions.length} active session${data.sessions.length === 1 ? '' : 's'}` : undefined}
          />
        </div>

        {hb && !online ? (
          <p className="text-[var(--color-bad)] text-sm">
            Daemon last seen {minutesAgo(hb.last_seen)} minutes ago. It may be stopped.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-[var(--color-muted)] text-sm">Loading.</p>
          ) : data && data.tickets.length > 0 ? (
            data.tickets.map((t) => <TicketRow key={t.id} ticket={t} />)
          ) : (
            <p className="text-[var(--color-muted)] text-sm">No tickets in flight.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}
