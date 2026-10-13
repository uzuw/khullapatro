// Test-server preload only. Production never imports fixtures or changes its clock.
import { readFileSync } from 'node:fs';

const originalFetch = globalThis.fetch;
const OriginalDate = Date;
const started = OriginalDate.now();
const epoch = OriginalDate.parse('2026-10-13T06:00:00Z');
globalThis.Date = class Date extends OriginalDate {
  constructor(...args) {
    super(...(args.length ? args : [epoch + OriginalDate.now() - started]));
  }
  static now() {
    return epoch + OriginalDate.now() - started;
  }
  static parse(value) {
    return OriginalDate.parse(value);
  }
  static UTC(...args) {
    return OriginalDate.UTC(...args);
  }
};
const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8'));
const calendar = fixture('calendar-bootstrap');
const months = new Map(
  ['2000-1', '2100-1', '2100-12', '2083-12', '2084-1'].map((key) => [
    key,
    fixture(`calendar-${key}`),
  ]),
);
const rashifal = fixture('rashifal-bootstrap');
const quote = fixture('metals-quote');
const history = fixture('metals-history-browser');
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.hostname === 'www.hamropatro.com') {
    const key = url.pathname.replace('/calendar/', '').replace('/', '-');
    const body = url.pathname === '/rashifal' ? rashifal : (months.get(key) ?? calendar);
    return new Response(
      `<script id="hp-bootstrap" type="application/json">${JSON.stringify(body)}</script>`,
      { headers: { 'Content-Type': 'text/html' } },
    );
  }
  if (url.hostname === 'api.fenegosida.org') {
    const body = url.pathname.endsWith('/today') ? quote : history;
    return Response.json(body);
  }
  return originalFetch(input, init);
};
