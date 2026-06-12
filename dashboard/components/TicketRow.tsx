import Link from 'next/link';
import type { Ticket } from '@/lib/types';

function StateBadge({ state }: { state: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-muted)]">
      {state}
    </span>
  );
}

export default function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex items-center gap-3 px-4 py-3 border border-[var(--color-border)] rounded bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-colors"
    >
      <span className="text-[var(--color-accent)] text-sm font-medium shrink-0">{ticket.identifier}</span>
      <span className="text-sm truncate flex-1">{ticket.title ?? 'Untitled'}</span>
      {ticket.readiness_score !== null ? (
        <span className="text-[var(--color-muted)] text-xs shrink-0">readiness {ticket.readiness_score}</span>
      ) : null}
      <StateBadge state={ticket.state} />
      {ticket.pr_url ? (
        <a
          href={ticket.pr_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--color-accent)] text-xs shrink-0 hover:underline"
        >
          PR
        </a>
      ) : null}
    </Link>
  );
}
