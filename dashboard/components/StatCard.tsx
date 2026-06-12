type Tone = 'default' | 'good' | 'bad';

const toneColor: Record<Tone, string> = {
  default: 'var(--color-text)',
  good: 'var(--color-good)',
  bad: 'var(--color-bad)',
};

export default function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-4 flex flex-col gap-1">
      <div className="text-[var(--color-muted)] text-xs uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold" style={{ color: toneColor[tone] }}>{value}</div>
      {sub ? <div className="text-[var(--color-muted)] text-xs">{sub}</div> : null}
    </div>
  );
}
