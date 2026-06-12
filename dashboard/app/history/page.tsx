'use client';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { useLiveQuery } from '@/lib/useLiveQuery';
import type { Ticket } from '@/lib/types';

const TABLES = ['tickets', 'sessions'];

function fmt(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function HistoryPage() {
  const { data, loading } = useLiveQuery<Ticket[]>(async (sb) => {
    const res = await sb
      .from('tickets')
      .select('*')
      .in('state', ['done', 'failed'])
      .order('updated_at', { ascending: false });
    return (res.data as Ticket[]) ?? [];
  }, TABLES);

  const tickets = data ?? [];

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-bold">History</h1>

        {loading ? (
          <p className="text-[var(--color-muted)] text-sm">Loading.</p>
        ) : tickets.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm">Nothing finished yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--color-muted)] text-xs uppercase tracking-wider text-left">
                <th className="py-2 pr-2 font-medium">Ticket</th>
                <th className="py-2 pr-2 font-medium">Title</th>
                <th className="py-2 pr-2 font-medium">State</th>
                <th className="py-2 pr-2 font-medium">PR</th>
                <th className="py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-2">
                    <Link href={`/tickets/${t.id}`} className="text-[var(--color-accent)] hover:underline">
                      {t.identifier}
                    </Link>
                  </td>
                  <td className="py-2 pr-2 truncate max-w-xs">{t.title ?? 'Untitled'}</td>
                  <td className="py-2 pr-2">
                    <span className="text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-muted)]">
                      {t.state}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    {t.pr_url ? (
                      <a href={t.pr_url} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">
                        PR
                      </a>
                    ) : (
                      <span className="text-[var(--color-muted)]">-</span>
                    )}
                  </td>
                  <td className="py-2 text-[var(--color-muted)]">{fmt(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
