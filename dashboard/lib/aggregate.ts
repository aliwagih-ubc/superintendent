import type { CostEvent } from './types';

export function sumBy(events: CostEvent[]): number {
  return events.reduce((acc, e) => acc + (e.cost_usd ?? 0), 0);
}

export function groupSum(events: CostEvent[], key: (e: CostEvent) => string): Array<{ key: string; cost: number }> {
  const map = new Map<string, number>();
  for (const e of events) {
    map.set(key(e), (map.get(key(e)) ?? 0) + (e.cost_usd ?? 0));
  }
  return [...map.entries()].map(([k, cost]) => ({ key: k, cost })).sort((a, b) => b.cost - a.cost);
}
