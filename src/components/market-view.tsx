'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Coins,
  Circle,
  MoveUpRight,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageMotion } from '@/components/shell';
import { DataNotice, PageHeading, SourceNote, Unavailable } from '@/components/shared';
import { useData } from '@/hooks/use-data';
import { formatDate, money, nepalDate } from '@/lib/date';
import { periodHistory, summarize, type Metal } from '@/lib/market';
import type { Envelope, MetalsData, Quote } from '@/lib/contracts';
import { cn } from '@/lib/utils';

function Movement({
  current,
  previous,
  date,
}: {
  current: number | null;
  previous: number | null;
  date?: string;
}) {
  if (current === null || previous === null || !date)
    return <p className="quote-change neutral">Previous quote unavailable</p>;
  const difference = current - previous;
  const Icon = difference < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <p className={cn('quote-change', difference < 0 ? 'down' : difference > 0 ? 'up' : 'neutral')}>
      <Icon size={14} />
      {difference > 0 ? '+' : ''}
      {money(difference)}{' '}
      <span>
        ({difference > 0 ? '+' : ''}
        {((difference / previous) * 100).toFixed(2)}%) vs {formatDate(date)}
      </span>
    </p>
  );
}

export function MarketView({
  initial,
  initialError,
}: {
  initial: Envelope<MetalsData> | null;
  initialError?: string;
}) {
  const { data, error, loading, load } = useData(initial, '/api/metals', initialError);
  const [metal, setMetal] = useState<Metal>('gold');
  const [period, setPeriod] = useState(30);
  const [expanded, setExpanded] = useState(false);
  const retry = () => void load();
  const market = data?.data;
  const rows = periodHistory(market?.history ?? [], period);
  const summary = summarize(rows, metal);
  const tableRows = [...rows].reverse();
  const shownRows = expanded ? tableRows : tableRows.slice(0, 7);
  const previous = (kind: Metal) => {
    if (market?.previousQuote?.[kind] !== null && market?.previousQuote?.[kind] !== undefined)
      return { value: market.previousQuote[kind], date: market.previousQuote.date };
    const row = [...(market?.history ?? [])]
      .reverse()
      .find((r) => r.date < (market?.quote?.date ?? '') && r[kind] !== null);
    return { value: row?.[kind] ?? null, date: row?.date };
  };
  return (
    <PageMotion>
      <PageHeading
        title="Keep an eye on value."
        subtitle="Nepal’s gold and silver rates, with the bigger picture."
        art="metals"
        note="सुनचाँदीको बजार"
      />
      <DataNotice error={error} meta={data?.meta} retry={retry} loading={loading} />
      {!market || !data ? (
        <Unavailable error={error} retry={retry} loading={loading} />
      ) : (
        <>
          <div className="market-date">
            <span>
              {market.quote
                ? `Published ${formatDate(market.quote.date)}`
                : 'Current published quote unavailable'}
            </span>
            <span>NPR per tola</span>
          </div>
          <div className="quote-grid">
            {(['gold', 'silver'] as const).map((kind) => (
              <div key={kind} className={`quote-card quote-${kind}`}>
                <div className="quote-label">
                  <span className="metal-mark">
                    {kind === 'gold' ? <Coins size={18} /> : <Circle size={18} />}
                  </span>
                  <div>
                    <h2>{kind === 'gold' ? 'Fine gold' : 'Silver'}</h2>
                    <span lang="ne" className="np">
                      {kind === 'gold' ? 'छापावाल सुन' : 'असली चाँदी'}
                    </span>
                  </div>
                  <span className="quote-unit">1 tola</span>
                </div>
                <p className="quote-value">
                  {market.quote?.[kind] !== null && market.quote?.[kind] !== undefined ? (
                    <>
                      <span>रु</span> {money(market.quote[kind]!)}
                    </>
                  ) : (
                    <span className="quote-unavailable">Unavailable</span>
                  )}
                </p>
                <Movement
                  current={market.quote?.[kind] ?? null}
                  previous={previous(kind).value}
                  date={previous(kind).date}
                />
              </div>
            ))}
          </div>
          <section
            className="chart-panel"
            aria-label="Historical market dashboard"
            aria-busy={loading}
          >
            <div className="chart-toolbar">
              <div>
                <h2>Price movement</h2>
                <p>Published rates. A clearer perspective.</p>
              </div>
              <div className="chart-selectors">
                <Tabs
                  value={metal}
                  onValueChange={(v) => setMetal(v as Metal)}
                  aria-label="Choose metal"
                >
                  <TabsList>
                    <TabsTrigger value="gold">Gold</TabsTrigger>
                    <TabsTrigger value="silver">Silver</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Tabs
                  value={String(period)}
                  onValueChange={(v) => setPeriod(Number(v))}
                  aria-label="Choose chart period"
                >
                  <TabsList>
                    <TabsTrigger value="7">7D</TabsTrigger>
                    <TabsTrigger value="30">30D</TabsTrigger>
                    <TabsTrigger value="365">1Y</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            {summary ? (
              <>
                <div className="chart-period">
                  <span>
                    {formatDate(summary.start)} – {formatDate(summary.end)}
                  </span>
                  <span
                    className={cn(summary.change !== null && summary.change < 0 ? 'down' : 'up')}
                  >
                    {summary.change === null
                      ? 'Period change unavailable'
                      : `${summary.change >= 0 ? '+' : ''}${money(summary.change)} NPR (${summary.percent!.toFixed(2)}%)`}
                  </span>
                </div>
                <PriceChart rows={rows} metal={metal} />
                <div className="market-stats">
                  <div>
                    <span>Period low</span>
                    <strong>रु {money(summary.low)}</strong>
                  </div>
                  <div>
                    <span>Period high</span>
                    <strong>रु {money(summary.high)}</strong>
                  </div>
                  <div>
                    <span>Available observations</span>
                    <strong>
                      {summary.rows.length}
                      <small> in {period} days</small>
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="chart-empty">No {metal} history is available for this period.</div>
            )}
            <p className="chart-disclosure">
              {market.historyMeta.status === 'stale' ? 'Saved history · ' : ''}Historical rates, not
              a forecast. Gaps are not filled with estimates.
            </p>
          </section>
          <section className="history-panel" aria-label="Historical prices table">
            <div className="section-title">
              <h2>Daily rate history</h2>
              <span>{metal === 'gold' ? 'Fine gold' : 'Silver'} · NPR / tola</span>
            </div>
            {tableRows.length ? (
              <>
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">
                      {metal} prices per tola for the selected {period}-day period
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">{metal === 'gold' ? 'Gold' : 'Silver'} (NPR / tola)</th>
                        <th scope="col">Change from previous available record</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownRows.map((row) => {
                        const prior = [...market.history]
                          .reverse()
                          .find((r) => r.date < row.date && r[metal] !== null);
                        const difference =
                          row[metal] !== null &&
                          prior?.[metal] !== null &&
                          prior?.[metal] !== undefined
                            ? row[metal]! - prior[metal]
                            : null;
                        return (
                          <tr key={row.date}>
                            <td>{formatDate(row.date)}</td>
                            <td>{row[metal] === null ? 'Unavailable' : money(row[metal]!)}</td>
                            <td
                              className={cn(
                                difference !== null && difference < 0
                                  ? 'down'
                                  : difference !== null && difference > 0
                                    ? 'up'
                                    : 'neutral',
                              )}
                            >
                              {difference === null
                                ? 'Unavailable'
                                : `${difference > 0 ? '+' : ''}${money(difference)}`}
                              {prior && difference !== null ? (
                                <small> vs {formatDate(prior.date)}</small>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {tableRows.length > 7 ? (
                  <Button
                    variant="ghost"
                    className="history-expand"
                    onClick={() => setExpanded(!expanded)}
                  >
                    <ChevronDown size={14} className={expanded ? 'rotate-180' : ''} />
                    {expanded
                      ? 'Show fewer observations'
                      : `Show all ${tableRows.length} observations`}
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">No dated history is available.</p>
            )}
          </section>
          <SourceNote meta={data.meta} />
          <p className="market-footnote">
            Benchmark rates from FENEGOSIDA. Shop prices may include making charges and other costs.
            {market.historyMeta.fetchedAt
              ? ` History retrieved ${formatDate(nepalDate(new Date(market.historyMeta.fetchedAt)))}.`
              : ''}
          </p>
          <div className="section-crosslinks">
            <Link href="/">
              Back to the calendar <ArrowUpRight size={15} />
            </Link>
            <Link href="/rashifal">
              Your daily rashifal <ArrowUpRight size={15} />
            </Link>
          </div>
        </>
      )}
    </PageMotion>
  );
}

function PriceChart({ rows, metal }: { rows: Quote[]; metal: Metal }) {
  const [hover, setHover] = useState<number | null>(null);
  const valid = rows.filter((r) => r[metal] !== null);
  if (!valid.length) return null;
  const values = valid.map((r) => r[metal]!);
  const min = Math.min(...values),
    max = Math.max(...values);
  const pad = Math.max((max - min) * 0.18, max * 0.003);
  const low = min - pad,
    high = max + pad;
  const firstDate = Date.parse(rows[0].date),
    duration = Math.max(86400000, Date.parse(rows.at(-1)!.date) - firstDate);
  const x = (r: Quote) => 80 + ((Date.parse(r.date) - firstDate) / duration) * 880;
  const y = (value: number) => 235 - ((value - low) / (high - low)) * 205;
  let path = '';
  let last: Quote | null = null;
  for (const row of rows) {
    if (row[metal] === null) {
      last = null;
      continue;
    }
    const connect = last && Date.parse(row.date) - Date.parse(last.date) <= 86400000;
    path += `${connect ? 'L' : 'M'}${x(row).toFixed(1)},${y(row[metal]!).toFixed(1)} `;
    last = row;
  }
  const active = hover === null ? valid.at(-1)! : valid[Math.min(hover, valid.length - 1)];
  return (
    <div className={`price-chart chart-${metal}`}>
      <div className="chart-hover-value">
        {formatDate(active.date)} <strong>रु {money(active[metal]!)}</strong>
      </div>
      <svg
        viewBox="0 0 1000 285"
        role="img"
        aria-label={`${metal} historical price chart; all exact observations are in the table below.`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const target = ((e.clientX - box.left) / box.width) * 1000;
          let closest = 0;
          valid.forEach((r, i) => {
            if (Math.abs(x(r) - target) < Math.abs(x(valid[closest]) - target)) closest = i;
          });
          setHover(closest);
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const value = low + ((high - low) * i) / 3;
          return (
            <g key={i}>
              <line
                x1="80"
                x2="965"
                y1={y(value)}
                y2={y(value)}
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
              />
              <text
                x="65"
                y={y(value) + 4}
                textAnchor="end"
                fill="var(--chart-label)"
                fontSize="12"
              >
                <tspan className="chart-wide-label">{money(Math.round(value))}</tspan>
                <tspan className="chart-mobile-label">
                  {new Intl.NumberFormat('en', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value)}
                </tspan>
              </text>
            </g>
          );
        })}
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <g className="chart-points">
          {valid.map((row) => (
            <circle key={row.date} cx={x(row)} cy={y(row[metal]!)} r="3" fill="currentColor" />
          ))}
        </g>
        {hover !== null ? (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1="25"
              y2="240"
              stroke="currentColor"
              strokeDasharray="3 4"
              opacity=".35"
            />
            <circle
              cx={x(active)}
              cy={y(active[metal]!)}
              r="5"
              fill="currentColor"
              stroke="var(--chart-point-border)"
              strokeWidth="2"
            />
          </g>
        ) : null}
        <text x="80" y="272" fill="var(--chart-label)" fontSize="12">
          {formatDate(rows[0].date)}
        </text>
        <text x="960" y="272" fill="var(--chart-label)" textAnchor="end" fontSize="12">
          {formatDate(rows.at(-1)!.date)}
        </text>
      </svg>
      <span className="chart-unit">
        NPR / tola <MoveUpRight size={10} />
      </span>
    </div>
  );
}
