'use client';
import Shell from '@/components/Shell';
import { useLiveQuery } from '@/lib/useLiveQuery';
import { sumBy, groupSum } from '@/lib/aggregate';
import type { CostEvent } from '@/lib/types';

const TABLES = ['cost_events'];

function usd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ key: string; cost: number }> }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 flex flex-col gap-2">
      <div className="text-[var(--color-muted)] text-xs uppercase tracking-wider">{title}</div>
      {rows.length === 0 ? (
        <div className="text-[var(--color-muted)] text-sm">No data.</div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-[var(--color-border)] first:border-t-0">
                <td className="py-1 pr-2 truncate">{r.key}</td>
                <td className="py-1 text-right tabular-nums">{usd(r.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function CostPage() {
  const { data, loading } = useLiveQuery<CostEvent[]>(async (sb) => {
    const res = await sb.from('cost_events').select('*').order('created_at', { ascending: false }).limit(5000);
    return (res.data as CostEvent[]) ?? [];
  }, TABLES);

  const events = data ?? [];
  const total = sumBy(events);
  const byTicket = groupSum(events, (e) => e.ticket_identifier ?? e.ticket_id);
  const byModel = groupSum(events, (e) => e.model);
  const byDeveloper = groupSum(events, (e) => e.developer ?? '(unknown)');
  const byDay = groupSum(events, (e) => e.created_at.slice(0, 10));

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-bold">Cost</h1>

        {loading ? (
          <p className="text-[var(--color-muted)] text-sm">Loading.</p>
        ) : events.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm">
            No cost recorded yet. Cost is tracked from the day publishing was enabled.
          </p>
        ) : (
          <>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-6 flex flex-col gap-1">
              <div className="text-[var(--color-muted)] text-xs uppercase tracking-wider">Total spend</div>
              <div className="text-3xl font-bold text-[var(--color-accent)] tabular-nums">{usd(total)}</div>
              <div className="text-[var(--color-muted)] text-xs">{events.length} events</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Breakdown title="By ticket" rows={byTicket} />
              <Breakdown title="By model" rows={byModel} />
              <Breakdown title="By developer" rows={byDeveloper} />
              <Breakdown title="By day" rows={byDay} />
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
