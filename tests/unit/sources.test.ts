import assert from 'node:assert/strict';
import { test, beforeEach, afterEach } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { cached, clearCacheMemory } from '../../src/lib/cache';
import { dateKeySchema, SourceError } from '../../src/lib/contracts';
import { extractBootstrap, fetchSource } from '../../src/lib/sources/http';
import {
  getCalendar,
  parseCalendar,
  parseRashifal,
  getRashifal,
} from '../../src/lib/sources/patro';
import {
  getMetals,
  parseMetalsQuote,
  parseMetalsHistory,
  quoteUrl,
} from '../../src/lib/sources/metals';
import { nepalDate } from '../../src/lib/date';

const fixture = async (name: string) =>
  JSON.parse(await readFile(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));
const calendarFixture = await fixture('calendar-bootstrap');
const rashifalFixture = await fixture('rashifal-bootstrap');
const quoteFixture = await fixture('metals-quote');
const historyFixture = await fixture('metals-history');
const html = (value: unknown) =>
  `<script type="application/json" id="hp-bootstrap">${JSON.stringify(value)}</script>`;
const originalFetch = globalThis.fetch;
const originalDirectory = process.env.KHULLAPATRO_CACHE_DIR;
let directory: string;
beforeEach(async () => {
  clearCacheMemory();
  directory = await mkdtemp(join(tmpdir(), 'khullapatro-test-'));
  process.env.KHULLAPATRO_CACHE_DIR = directory;
});
afterEach(async () => {
  clearCacheMemory();
  globalThis.fetch = originalFetch;
  if (originalDirectory === undefined) delete process.env.KHULLAPATRO_CACHE_DIR;
  else process.env.KHULLAPATRO_CACHE_DIR = originalDirectory;
  await rm(directory, { recursive: true, force: true });
});

test('calendar retains real BS/AD mapping, all six source events, tithi and holiday wording', () => {
  const result = parseCalendar(html(calendarFixture), 2083, 6);
  assert.equal(result.data.daysInMonth, 31);
  const day = result.data.days.find((value) => value.bs.day === 1 && value.inMonth)!;
  assert.equal(day.ad, '2026-09-17');
  assert.equal(day.weekday, 4);
  assert.equal(day.events.length, 6);
  assert.deepEqual(
    day.events.map((value) => value.titleNp),
    calendarFixture.data.calendar.initialMonths[0].days
      .find((value: { inMonth: boolean; day_bs: number }) => value.inMonth && value.day_bs === 1)
      .patroEvent.items.map((value: { titleNp: string }) => value.titleNp),
  );
  assert.equal(day.tithi, 'षष्ठी');
  assert(result.data.days.some((value) => value.events.some((event) => event.isHoliday)));
  assert.equal(result.sourceDate, '2026-10-13');
});

test('calendar rejects wrong requested months, fabricated AD dates, gaps, and malformed events', () => {
  assert.throws(() => parseCalendar(html(calendarFixture), 2083, 7));
  for (const mutate of [
    (raw: typeof calendarFixture) => {
      raw.data.calendar.initialMonths[0].days[0].day_ad = 32;
    },
    (raw: typeof calendarFixture) => {
      raw.data.calendar.initialMonths[0].days[0].dayOfWeek = 1;
    },
    (raw: typeof calendarFixture) => {
      raw.data.calendar.initialMonths[0].days[1].day_ad = 13;
    },
    (raw: typeof calendarFixture) => {
      raw.data.calendar.initialMonths[0].days.find(
        (day: { inMonth: boolean }) => day.inMonth,
      ).day_bs = 2;
    },
    (raw: typeof calendarFixture) => {
      raw.data.calendar.initialMonths[0].days[0].patroEvent.items.push({
        titleNp: '',
        isHoliday: false,
      });
    },
  ]) {
    const raw = structuredClone(calendarFixture);
    mutate(raw);
    assert.throws(() => parseCalendar(html(raw), 2083, 6));
  }
});

test('current calendar selects actual mapped Nepal date and does not trust cached source Today', () => {
  const raw = structuredClone(calendarFixture);
  raw.today.adKey = '2026-10-12';
  raw.today.date_ad = 12;
  raw.today.date_bs = 26;
  assert.equal(parseCalendar(html(raw), undefined, undefined, '2026-10-13').data.monthBs, 6);
  assert.throws(() => parseCalendar(html(raw), undefined, undefined, '2027-01-01'));
});

test('calendar parameters fail before contacting an upstream source', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Should not fetch');
  };
  for (const [year, month] of [
    [2083, undefined],
    [undefined, 6],
    [1999, 1],
    [2101, 1],
    [2083.5, 6],
    [2083, 13],
  ]) {
    await assert.rejects(
      getCalendar(year, month),
      (error: unknown) => error instanceof SourceError && error.status === 400,
    );
  }
  assert.equal(calls, 0);
});

test('rashifal requires twelve unique signs and maps the source label without inventing translations', () => {
  const result = parseRashifal(html(rashifalFixture));
  assert.equal(result.data.signs.length, 12);
  assert.equal(result.data.readingDateAd, '2026-10-13');
  assert(result.data.signs.every((sign) => sign.textEn === null));
  const raw = structuredClone(rashifalFixture);
  raw.data.rashifal.signs[1].slug = 'mesh';
  assert.throws(() => parseRashifal(html(raw)));
  raw.data.rashifal.signs[1].slug = 'brish';
  raw.data.rashifal.signs[0].descNp = '';
  assert.throws(() => parseRashifal(html(raw)));
});

test('rashifal unverified/mismatched dates retain the original label and warn', () => {
  for (const label of [
    '२६ आश्विन २०८३ मंगलवार',
    '२७ अज्ञात २०८३ मंगलवार',
    '२७ आश्विन २०८३ सोमवार',
  ]) {
    const raw = structuredClone(rashifalFixture);
    raw.data.rashifal.date = label;
    const result = parseRashifal(html(raw));
    assert.equal(result.data.readingDateAd, null);
    assert.equal(result.data.readingDateLabelNp, label);
    assert.equal(result.warnings[0].code, 'READING_DATE_UNVERIFIED');
  }
});

test('metals select explicit Nepal per-tola rows and retain independent previous source date', () => {
  const result = parseMetalsQuote(quoteFixture);
  assert.deepEqual(result.quote, { date: '2026-10-13', gold: 292200, silver: 4355 });
  assert.deepEqual(result.previousQuote, { date: '2026-10-12', gold: 294400, silver: 4415 });
  const decimal = structuredClone(quoteFixture);
  decimal[1].todayBaseRatePerGram = 292200.25;
  assert.equal(parseMetalsQuote(decimal).quote.gold, 292200.25);
  assert.throws(() =>
    parseMetalsQuote(
      quoteFixture.filter((row: { rateType: string }) => row.rateType.includes('ग्राम')),
    ),
  );
  assert.throws(() => parseMetalsQuote([...quoteFixture, quoteFixture[1]]));
});

test('metals reject incompatible dates, negative rates and ambiguous units; zero remains unavailable', () => {
  const missing = quoteFixture.filter(
    (row: { rateType: string }) => !row.rateType.includes('चाँदी'),
  );
  assert.equal(parseMetalsQuote(missing).quote.silver, null);
  const zero = structuredClone(quoteFixture);
  zero[1].todayBaseRatePerGram = 0;
  assert.equal(parseMetalsQuote(zero).quote.gold, null);
  zero[3].todayBaseRatePerGram = 0;
  assert.throws(() => parseMetalsQuote(zero));
  const invalid = structuredClone(quoteFixture);
  invalid[1].todayBaseRatePerGram = -1;
  assert.throws(() => parseMetalsQuote(invalid));
  invalid[1].todayBaseRatePerGram = 1;
  invalid[3].todayDate = '2026-10-14T04:55:39Z';
  assert.throws(() => parseMetalsQuote(invalid));
});

test('history uses tola, sorts/deduplicates dates and preserves missing records without interpolation', () => {
  const raw = structuredClone(historyFixture);
  raw.goldData.reverse();
  raw.goldData.push(raw.goldData[0]);
  raw.silverData.splice(1, 1);
  const rows = parseMetalsHistory(raw);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].date, '2026-10-11');
  assert.equal(rows[1].silver, null);
  assert.equal(rows[2].gold, 292200);
  assert.equal(rows[2].silver, 4355);
  raw.goldData.push({ ...raw.goldData[0], tola: 5 });
  assert.throws(() => parseMetalsHistory(raw));
  assert.throws(() =>
    parseMetalsHistory({
      goldData: [{ year: '2026', month: 'Feb', date: '30', tola: 1 }],
      silverData: [],
    }),
  );
});

test('Gregorian validation and Nepal midnight are independent of device timezone', () => {
  assert.equal(nepalDate(new Date('2026-10-13T18:14:59Z')), '2026-10-13');
  assert.equal(nepalDate(new Date('2026-10-13T18:15:00Z')), '2026-10-14');
  assert.throws(() => dateKeySchema.parse('2026-02-30'));
  assert.equal(dateKeySchema.parse('2028-02-29'), '2028-02-29');
});

test('bootstrap extraction never evaluates scripts and rejects absent, duplicate, and broken JSON', () => {
  assert.deepEqual(
    extractBootstrap('<script>throw new Error("never execute");</script>' + html({ valid: true })),
    { valid: true },
  );
  for (const body of [
    '<html/>',
    html({}) + html({}),
    '<script id="hp-bootstrap">{broken}</script>',
  ])
    assert.throws(() => extractBootstrap(body));
});

test('upstream errors and timeouts have safe, meaningful error responses', async () => {
  globalThis.fetch = async () => new Response('private source body', { status: 404 });
  await assert.rejects(
    fetchSource('https://www.hamropatro.com/calendar/2083/6'),
    (error: unknown) =>
      error instanceof SourceError &&
      error.code === 'MONTH_UNAVAILABLE' &&
      !error.message.includes('private'),
  );
  globalThis.fetch = async () => {
    throw new DOMException('upstream internal detail', 'TimeoutError');
  };
  await assert.rejects(
    fetchSource(quoteUrl),
    (error: unknown) =>
      error instanceof SourceError && error.status === 504 && error.code === 'SOURCE_TIMEOUT',
  );
});

test('validated snapshots survive restart; failed refresh preserves successful timestamps and backs off', async () => {
  let calls = 0;
  const options = {
    key: 'test-calendar',
    source: 'test',
    sourceUrl: 'https://example.com/',
    schema: z.object({ actual: z.number().positive() }),
    ttl: 3600000,
    load: async () => {
      calls++;
      return { data: { actual: 6 }, sourceDate: '2026-10-13', sourceRenderedAt: null };
    },
  };
  const [first, coalesced] = await Promise.all([cached(options), cached(options)]);
  assert.equal(calls, 1);
  assert.deepEqual(first, coalesced);
  clearCacheMemory();
  const restarted = await cached(options);
  assert.equal(restarted.meta.servedFrom, 'snapshot');
  assert.equal(calls, 1);
  assert.equal(restarted.meta.fetchedAt, first.meta.fetchedAt);
  const failure = {
    ...options,
    ttl: 0,
    load: async () => {
      calls++;
      throw new Error('failed');
    },
  };
  const fallback = await cached(failure);
  assert.equal(fallback.meta.status, 'stale');
  assert.equal(fallback.meta.fetchedAt, first.meta.fetchedAt);
  assert.equal(fallback.data.actual, 6);
  assert(fallback.meta.warnings.some((warning) => warning.code === 'SOURCE_REFRESH_FAILED'));
  await cached(failure);
  assert.equal(calls, 2);
  clearCacheMemory();
  const persisted = await cached(failure);
  assert.equal(persisted.meta.servedFrom, 'snapshot');
  assert.equal(persisted.meta.fetchedAt, first.meta.fetchedAt);
});

test('invalid fresh data cannot overwrite an already validated snapshot', async () => {
  const options = {
    key: 'test-trust',
    source: 'test',
    sourceUrl: 'https://example.com/',
    schema: z.object({ actual: z.number().positive() }),
    ttl: 0,
    load: async () => ({ data: { actual: 6 }, sourceDate: '2026-10-13', sourceRenderedAt: null }),
  };
  const good = await cached(options);
  const bad = await cached({
    ...options,
    load: async () => ({ data: { actual: -6 }, sourceDate: '2026-10-14', sourceRenderedAt: null }),
  });
  assert.equal(bad.data.actual, 6);
  assert.equal(bad.meta.sourceDate, '2026-10-13');
  assert.equal(bad.meta.fetchedAt, good.meta.fetchedAt);
  const saved = JSON.parse(await readFile(join(directory, 'test-trust.json'), 'utf8'));
  assert.equal(saved.data.actual, 6);
  clearCacheMemory();
  saved.data.actual = -6;
  await writeFile(join(directory, 'test-trust.json'), JSON.stringify(saved));
  await assert.rejects(
    cached({
      ...options,
      load: async () => {
        throw new Error('offline');
      },
    }),
    SourceError,
  );
});

test('rashifal refreshes at Nepal rollover and never labels yesterday as fresh Today', async (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T18:14:59Z') });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(html(rashifalFixture));
  };
  const first = await getRashifal();
  assert.equal(first.meta.status, 'fresh');
  context.mock.timers.setTime(new Date('2026-10-13T18:15:00Z').getTime());
  const next = await getRashifal();
  assert.equal(calls, 2);
  assert.equal(next.meta.nepalDate, '2026-10-14');
  assert.equal(next.meta.sourceDate, '2026-10-13');
  assert.equal(next.meta.status, 'stale');
  assert(next.meta.warnings.some((warning) => warning.code === 'SOURCE_DATE_OLD'));
});

test('metals quote and chart fail independently; a historical record cannot become a new bulletin', async () => {
  globalThis.fetch = async (url) =>
    String(url) === quoteUrl
      ? new Response('unavailable', { status: 503 })
      : new Response(JSON.stringify(historyFixture));
  const historyOnly = await getMetals();
  assert.equal(historyOnly.data.quote, null);
  assert.equal(historyOnly.data.history.length, 3);
  assert.equal(historyOnly.data.historyMeta.status, 'fresh');
  assert.equal(historyOnly.meta.status, 'stale');
  assert(historyOnly.meta.warnings.some((warning) => warning.code === 'QUOTE_UNAVAILABLE'));
  clearCacheMemory();
  await rm(directory, { recursive: true, force: true });
  globalThis.fetch = async (url) =>
    String(url) === quoteUrl
      ? new Response(JSON.stringify(quoteFixture))
      : new Response('unavailable', { status: 503 });
  const quoteOnly = await getMetals();
  assert.equal(quoteOnly.data.quote?.gold, 292200);
  assert.equal(quoteOnly.data.historyMeta.status, 'unavailable');
  assert(quoteOnly.meta.warnings.some((warning) => warning.code === 'HISTORY_UNAVAILABLE'));
});

test('calendar adapter survives timeout and restart with the exact saved month', async (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T06:00:00Z') });
  globalThis.fetch = async () => new Response(html(calendarFixture));
  const first = await getCalendar(2083, 6);
  context.mock.timers.setTime(new Date('2026-10-14T06:00:01Z').getTime());
  globalThis.fetch = async () => {
    throw new DOMException('timeout', 'TimeoutError');
  };
  const saved = await getCalendar(2083, 6);
  assert.deepEqual(saved.data, first.data);
  assert.equal(saved.meta.status, 'stale');
  assert.equal(saved.meta.fetchedAt, first.meta.fetchedAt);
  clearCacheMemory();
  const restarted = await getCalendar(2083, 6);
  assert.equal(restarted.meta.servedFrom, 'snapshot');
  assert.deepEqual(restarted.data, first.data);
  await assert.rejects(getCalendar(2083, 7), SourceError);
});

test('incomplete rashifal cannot replace a dated complete snapshot', async (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T06:00:00Z') });
  globalThis.fetch = async () => new Response(html(rashifalFixture));
  const first = await getRashifal();
  context.mock.timers.setTime(new Date('2026-10-13T06:16:00Z').getTime());
  const broken = structuredClone(rashifalFixture);
  broken.data.rashifal.signs.pop();
  globalThis.fetch = async () => new Response(html(broken));
  const saved = await getRashifal();
  assert.deepEqual(saved.data, first.data);
  assert.equal(saved.meta.status, 'stale');
  assert.equal(saved.meta.sourceDate, first.meta.sourceDate);
  assert.equal(saved.meta.fetchedAt, first.meta.fetchedAt);
});

test('fresh bulletin with failed history retains independent saved-history provenance', async (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-13T06:00:00Z') });
  globalThis.fetch = async (url) =>
    new Response(JSON.stringify(String(url) === quoteUrl ? quoteFixture : historyFixture));
  const first = await getMetals();
  context.mock.timers.setTime(new Date('2026-10-13T12:00:01Z').getTime());
  globalThis.fetch = async (url) =>
    String(url) === quoteUrl
      ? new Response(JSON.stringify(quoteFixture))
      : new Response('offline', { status: 503 });
  const partial = await getMetals();
  assert.equal(partial.meta.status, 'fresh');
  assert.notEqual(partial.meta.fetchedAt, first.meta.fetchedAt);
  assert.equal(partial.data.historyMeta.status, 'stale');
  assert.equal(partial.data.historyMeta.fetchedAt, first.data.historyMeta.fetchedAt);
  assert.deepEqual(partial.data.history, first.data.history);
  assert(partial.meta.warnings.some((w) => w.code === 'HISTORY_STALE'));
});

test('source fetching follows one same-origin canonical slash redirect within the same deadline', async () => {
  const calls: { url: string; signal: AbortSignal | null | undefined }[] = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(options?.redirect, 'manual');
    calls.push({ url: String(url), signal: options?.signal });
    return calls.length === 1
      ? new Response(null, { status: 308, headers: { location: '/calendar/2100/12/' } })
      : new Response('verified response');
  };
  assert.equal(
    await fetchSource('https://www.hamropatro.com/calendar/2100/12'),
    'verified response',
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://www.hamropatro.com/calendar/2100/12/');
  assert.equal(calls[0].signal, calls[1].signal);
});

test('source fetching rejects changed origins, login paths, challenge queries, and redirect chains', async (context) => {
  context.mock.method(console, 'error', () => {});
  for (const location of [
    'https://example.com/calendar/2100/12/',
    '/login',
    '/calendar/2100/12?__cf_chl_rt_tk=challenge',
    'https://user:password@www.hamropatro.com/calendar/2100/12/',
  ]) {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response(null, { status: 302, headers: { location } });
    };
    await assert.rejects(fetchSource('https://www.hamropatro.com/calendar/2100/12'), SourceError);
    assert.equal(calls, 1);
  }
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(null, { status: 308, headers: { location: '/calendar/2100/12/' } });
  };
  await assert.rejects(fetchSource('https://www.hamropatro.com/calendar/2100/12'), SourceError);
  assert.equal(calls, 2);
});

test('Hamro calendar locale redirects retain the exact requested year and month', async () => {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    if (calls === 1)
      return new Response(null, { status: 307, headers: { location: '/en/calendar/2083/6' } });
    assert.equal(String(url), 'https://www.hamropatro.com/en/calendar/2083/6');
    return new Response(html(calendarFixture));
  };
  const body = await fetchSource('https://www.hamropatro.com/calendar/2083/6');
  const normalized = parseCalendar(body, 2083, 6).data;
  assert.deepEqual(normalized, parseCalendar(html(calendarFixture), 2083, 6).data);
  assert.equal(calls, 2);
});
