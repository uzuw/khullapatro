import assert from 'node:assert/strict';
import { parseCalendar, parseRashifal } from '../src/lib/sources/patro';
import {
  parseMetalsQuote,
  parseMetalsHistory,
  quoteUrl,
  historyUrl,
} from '../src/lib/sources/metals';
import { fetchSource } from '../src/lib/sources/http';
import { summarize, periodHistory } from '../src/lib/market';

const origin = 'http://127.0.0.1:3001';
const api = async (path: string) => {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200, `${path}: expected a working local endpoint`);
  return response.json();
};
const [home, reading, bulletin, history, calendarApi, readingApi, marketApi] = await Promise.all([
  fetchSource('https://www.hamropatro.com/'),
  fetchSource('https://www.hamropatro.com/rashifal'),
  fetchSource(quoteUrl),
  fetchSource(historyUrl),
  api('/api/calendar'),
  api('/api/rashifal'),
  api('/api/metals'),
]);
const calendar = parseCalendar(home).data;
assert.deepEqual(calendarApi.data, calendar);
assert.deepEqual(readingApi.data, parseRashifal(reading).data);
assert.deepEqual(marketApi.data.quote, parseMetalsQuote(JSON.parse(bulletin)).quote);
const observations = parseMetalsHistory(JSON.parse(history));
assert.deepEqual(marketApi.data.history, observations);
const ranges = await Promise.all(
  [
    [2000, 1],
    [2100, 12],
    [2083, 12],
    [2084, 1],
  ].map(async ([year, month]) => {
    const [source, local] = await Promise.all([
      fetchSource(`https://www.hamropatro.com/calendar/${year}/${month}`),
      api(`/api/calendar?year=${year}&month=${month}`),
    ]);
    const actual = parseCalendar(source, year, month).data;
    assert.deepEqual(local.data, actual);
    return {
      year,
      month,
      days: actual.daysInMonth,
      startsAd: actual.days.find((d) => d.inMonth)!.ad,
    };
  }),
);
console.log(
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      calendar: {
        year: calendar.yearBs,
        month: calendar.monthBs,
        days: calendar.daysInMonth,
        cells: calendar.days.length,
        events: calendar.days.reduce((n, d) => n + d.events.length, 0),
      },
      rashifal: {
        date: readingApi.data.readingDateAd,
        completeSigns: readingApi.data.signs.length,
      },
      metals: {
        quote: marketApi.data.quote,
        unit: marketApi.data.unit,
        observations: observations.length,
        periods: [7, 30, 365].map((days) => ({
          days,
          gold: summarize(periodHistory(observations, days), 'gold')?.rows.length,
          silver: summarize(periodHistory(observations, days), 'silver')?.rows.length,
        })),
      },
      sampledMonths: ranges,
    },
    null,
    2,
  ),
);
