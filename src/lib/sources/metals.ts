import { z } from 'zod';
import { cached } from '../cache';
import {
  dateKeySchema,
  metalsSchema,
  quoteSchema,
  SourceError,
  type Envelope,
  type MetalsData,
  type Quote,
  type SourceWarning,
} from '../contracts';
import { nepalDate } from '../date';
import { fetchSource } from './http';
import { nepaliToAscii } from './patro';

export const quoteUrl = 'https://api.fenegosida.org/api/website/v1/Dashboard/today';
export const historyUrl =
  'https://api.fenegosida.org/api/website/v1/Dashboard/WeeklyChartRate?weekmonthyear=365';
const quoteDataSchema = z.object({ quote: quoteSchema, previousQuote: quoteSchema.nullable() });
const historySchema = z
  .array(quoteSchema)
  .min(1)
  .max(1000)
  .refine(
    (rows) => rows.every((row, index) => index === 0 || row.date > rows[index - 1].date),
    'History dates must be unique and sorted',
  );
const publishedDate = (timestamp: string) => {
  if (
    !/^\d{4}-\d{2}-\d{2}T/.test(timestamp) ||
    !/(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp))
  )
    throw new Error('Invalid publication timestamp');
  dateKeySchema.parse(timestamp.slice(0, 10));
  return dateKeySchema.parse(nepalDate(new Date(timestamp)));
};
const price = (value: number | null) =>
  value === 0 || value === null ? null : z.number().positive().finite().parse(value);

export function parseMetalsQuote(value: unknown) {
  const rows = z
    .array(
      z.object({
        rateType: z.string().max(200),
        todayDate: z.string(),
        yestardayDate: z.string().nullable(),
        todayBaseRatePerGram: z.number().finite().nullable(),
        yestardayBaseRatePerGram: z.number().finite().nullable(),
      }),
    )
    .max(100)
    .parse(value);
  const selected = {
    gold: rows.filter((row) =>
      /^छापावाल\s+सुन\s*\(1\s+तोला\)$/.test(nepaliToAscii(row.rateType).trim()),
    ),
    silver: rows.filter((row) =>
      /^असली\s+चाँदी(?:\s+दर)?\s*\(1\s+तोला\)$/.test(nepaliToAscii(row.rateType).trim()),
    ),
  };
  if (
    selected.gold.length > 1 ||
    selected.silver.length > 1 ||
    selected.gold.length + selected.silver.length === 0
  )
    throw new Error('Ambiguous per-tola quote');
  const quote: Quote = { date: '', gold: null, silver: null };
  const previous: Quote = { date: '', gold: null, silver: null };
  for (const metal of ['gold', 'silver'] as const) {
    const row = selected[metal][0];
    if (!row) continue;
    const date = publishedDate(row.todayDate);
    if (quote.date && quote.date !== date) throw new Error('Incompatible metal publication dates');
    quote.date = date;
    quote[metal] = price(row.todayBaseRatePerGram);
    const previousPrice = price(row.yestardayBaseRatePerGram);
    if (row.yestardayDate && previousPrice !== null) {
      const previousDate = publishedDate(row.yestardayDate);
      if (previous.date && previous.date !== previousDate)
        throw new Error('Incompatible previous publication dates');
      if (previousDate >= date) throw new Error('Previous quote is not earlier');
      previous.date = previousDate;
      previous[metal] = previousPrice;
    }
  }
  return quoteDataSchema.parse({
    quote,
    previousQuote: previous.gold !== null || previous.silver !== null ? previous : null,
  });
}

export function parseMetalsHistory(value: unknown): Quote[] {
  const rowSchema = z.object({
    date: z.string().regex(/^\d{1,2}$/),
    year: z.string().regex(/^\d{4}$/),
    month: z.enum([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]),
    tola: z.number().finite().nullable(),
  });
  const data = z
    .object({ goldData: z.array(rowSchema).max(1000), silverData: z.array(rowSchema).max(1000) })
    .parse(value);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const combined = new Map<string, Quote>();
  for (const metal of ['gold', 'silver'] as const) {
    const seen = new Map<string, number | null>();
    for (const row of data[metal === 'gold' ? 'goldData' : 'silverData']) {
      const date = dateKeySchema.parse(
        `${row.year}-${String(months.indexOf(row.month) + 1).padStart(2, '0')}-${row.date.padStart(2, '0')}`,
      );
      const amount = price(row.tola);
      if (seen.has(date) && seen.get(date) !== amount)
        throw new Error('Conflicting historical quotes');
      seen.set(date, amount);
      if (amount === null) continue;
      const quote = combined.get(date) || { date, gold: null, silver: null };
      quote[metal] = amount;
      combined.set(date, quote);
    }
  }
  return historySchema.parse([...combined.values()].sort((a, b) => a.date.localeCompare(b.date)));
}

export async function getMetals(): Promise<Envelope<MetalsData>> {
  const [currentResult, historyResult] = await Promise.allSettled([
    cached({
      key: 'metals-quote',
      source: 'FENEGOSIDA',
      sourceUrl: quoteUrl,
      schema: quoteDataSchema,
      ttl: 900000,
      daily: true,
      rollover: true,
      load: async () => {
        const data = parseMetalsQuote(JSON.parse(await fetchSource(quoteUrl)));
        return { data, sourceDate: data.quote.date, sourceRenderedAt: null };
      },
    }),
    cached({
      key: 'metals-history',
      source: 'FENEGOSIDA',
      sourceUrl: historyUrl,
      schema: historySchema,
      ttl: 21600000,
      load: async () => {
        const data = parseMetalsHistory(JSON.parse(await fetchSource(historyUrl)));
        return { data, sourceDate: data.at(-1)!.date, sourceRenderedAt: null };
      },
    }),
  ]);
  const current = currentResult.status === 'fulfilled' ? currentResult.value : null;
  const series = historyResult.status === 'fulfilled' ? historyResult.value : null;
  if (!current && !series)
    throw currentResult.status === 'rejected' && currentResult.reason instanceof SourceError
      ? currentResult.reason
      : new SourceError(
          502,
          'SOURCE_UNAVAILABLE',
          'Nepal benchmark rates are temporarily unavailable.',
        );
  const warnings: SourceWarning[] = [...(current?.meta.warnings || [])];
  if (!current)
    warnings.push({
      code: 'QUOTE_UNAVAILABLE',
      message:
        'The current bulletin is unavailable. The chart shows dated historical observations only.',
    });
  if (!series)
    warnings.push({
      code: 'HISTORY_UNAVAILABLE',
      message: 'Historical observations are temporarily unavailable.',
    });
  else if (series.meta.status === 'stale')
    warnings.push({
      code: 'HISTORY_STALE',
      message: 'The chart uses previously verified historical observations.',
    });
  if (current && (current.data.quote.gold === null || current.data.quote.silver === null))
    warnings.push({
      code: 'METAL_UNAVAILABLE',
      message: 'One metal was missing from the per-tola bulletin.',
    });
  const history = new Map<string, Quote>((series?.data || []).map((row) => [row.date, { ...row }]));
  const historyNewer =
    current && series && Date.parse(series.meta.fetchedAt) > Date.parse(current.meta.fetchedAt);
  for (const quote of [current?.data.previousQuote, current?.data.quote]) {
    if (!quote) continue;
    const existing = history.get(quote.date);
    if (
      existing &&
      (['gold', 'silver'] as const).some(
        (metal) =>
          quote[metal] !== null && existing[metal] !== null && quote[metal] !== existing[metal],
      )
    ) {
      warnings.push({
        code: 'RATE_REVISION',
        message: `Current bulletin and historical series differ for ${quote.date}; the more recently retrieved value is used in the chart.`,
      });
    }
    history.set(quote.date, {
      date: quote.date,
      gold: historyNewer ? (existing?.gold ?? quote.gold) : (quote.gold ?? existing?.gold ?? null),
      silver: historyNewer
        ? (existing?.silver ?? quote.silver)
        : (quote.silver ?? existing?.silver ?? null),
    });
  }
  const sortedHistory = [...history.values()].sort((a, b) => a.date.localeCompare(b.date));
  const data = metalsSchema.parse({
    currency: 'NPR',
    unit: 'tola',
    goldPurity: 'fine/hallmark',
    quote: current?.data.quote || null,
    previousQuote: current?.data.previousQuote || null,
    history: sortedHistory,
    historyMeta: {
      sourceUrl: historyUrl,
      fetchedAt: series?.meta.fetchedAt || null,
      status: series?.meta.status || 'unavailable',
      startDate: series?.data[0]?.date || null,
      endDate: series?.data.at(-1)?.date || null,
    },
  });
  const baseMeta = current?.meta || series!.meta;
  return {
    schemaVersion: 1,
    data,
    meta: {
      ...baseMeta,
      sourceUrl: 'https://www.fenegosida.org/',
      sourceDate: current?.data.quote.date || null,
      status: current ? current.meta.status : 'stale',
      warnings,
    },
  };
}
