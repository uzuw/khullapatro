import type { Quote } from '@/lib/contracts';

export type Metal = 'gold' | 'silver';
export function periodHistory(history: Quote[], days: number) {
  if (!history.length) return [];
  const end = Date.parse(history.at(-1)!.date);
  return history.filter((row) => Date.parse(row.date) >= end - (days - 1) * 86400000);
}
export function summarize(rows: Quote[], metal: Metal) {
  const actual = rows.filter((row) => row[metal] !== null);
  if (!actual.length) return null;
  const values = actual.map((r) => r[metal]!);
  const first = actual[0],
    last = actual.at(-1)!;
  const change = actual.length > 1 ? last[metal]! - first[metal]! : null;
  return {
    rows: actual,
    low: Math.min(...values),
    high: Math.max(...values),
    change,
    percent: change === null ? null : (change / first[metal]!) * 100,
    start: first.date,
    end: last.date,
  };
}
