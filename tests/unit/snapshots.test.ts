import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import type { get, put, GetBlobResult } from '@vercel/blob';
import { readSnapshot, writeSnapshot } from '../../src/lib/snapshots';
import type { Envelope } from '../../src/lib/contracts';

const originalStorage = process.env.KHULLAPATRO_CACHE_STORAGE;
const originalEnvironment = process.env.VERCEL_ENV;
beforeEach(() => {
  process.env.KHULLAPATRO_CACHE_STORAGE = 'blob';
  process.env.VERCEL_ENV = 'production';
});
afterEach(() => {
  if (originalStorage === undefined) delete process.env.KHULLAPATRO_CACHE_STORAGE;
  else process.env.KHULLAPATRO_CACHE_STORAGE = originalStorage;
  if (originalEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalEnvironment;
});
const envelope = (date: string): Envelope<unknown> => ({
  schemaVersion: 1,
  data: { date },
  meta: {
    source: 'Test',
    sourceUrl: 'https://example.com/',
    nepalDate: '2026-10-13',
    sourceDate: '2026-10-13',
    sourceRenderedAt: null,
    fetchedAt: date,
    checkedAt: date,
    status: 'fresh',
    servedFrom: 'upstream',
    warnings: [],
  },
});
function result(body: string, etag = 'one', size = Buffer.byteLength(body)): GetBlobResult {
  return {
    statusCode: 200,
    stream: new Response(body).body!,
    headers: new Headers(),
    blob: {
      url: 'https://example.private.blob.vercel-storage.com/snapshot.json',
      downloadUrl: 'https://example.private.blob.vercel-storage.com/snapshot.json',
      pathname: 'snapshot.json',
      contentDisposition: '',
      cacheControl: '',
      uploadedAt: new Date(),
      etag,
      contentType: 'application/json',
      size,
    },
  };
}

test('private shared snapshots survive a new client and isolate preview writes from production', async () => {
  const records = new Map<string, string>();
  let writes = 0;
  const client = {
    get: (async (path, options) => {
      assert.equal(options.access, 'private');
      assert.equal(options.useCache, false);
      const body = records.get(path);
      return body ? result(body, String(writes)) : null;
    }) as typeof get,
    put: (async (path, body, options) => {
      assert.equal(options.access, 'private');
      if (records.has(path)) assert.equal(options.ifMatch, String(writes));
      records.set(path, String(body));
      writes++;
      return {
        url: '',
        downloadUrl: '',
        pathname: path,
        contentType: 'application/json',
        contentDisposition: '',
        etag: String(writes),
      };
    }) as typeof put,
  };
  const first = envelope('2026-10-13T06:00:00Z');
  assert.equal(await writeSnapshot('calendar-current', first, client), true);
  assert.deepEqual(JSON.parse((await readSnapshot('calendar-current', { ...client }))!), first);
  process.env.VERCEL_ENV = 'preview';
  assert.equal(await readSnapshot('calendar-current', client), null);
  await writeSnapshot('calendar-current', envelope('2026-10-13T07:00:00Z'), client);
  process.env.VERCEL_ENV = 'production';
  assert.deepEqual(JSON.parse((await readSnapshot('calendar-current', client))!), first);
});

test('a slower refresh preserves a newer saved snapshot, and conflicting writes fail safely', async () => {
  let attempted = false;
  const newer = envelope('2026-10-13T07:00:00Z');
  const client = {
    get: (async () => result(JSON.stringify(newer), 'newer')) as typeof get,
    put: (async () => {
      attempted = true;
      throw new Error('ETag conflict');
    }) as typeof put,
  };
  assert.equal(await writeSnapshot('quote', envelope('2026-10-13T06:00:00Z'), client), true);
  assert.equal(attempted, false);
  assert.equal(await writeSnapshot('quote', envelope('2026-10-13T08:00:00Z'), client), false);
  assert.equal(attempted, true);
});

test('oversized, unavailable, and unsafe-path snapshots are rejected without exposing credentials', async () => {
  const client = {
    get: (async () => result('small body', 'one', 5_000_001)) as typeof get,
    put: (async () => {
      throw new Error('storage unavailable');
    }) as typeof put,
  };
  await assert.rejects(readSnapshot('quote', client), /too large/);
  await assert.rejects(readSnapshot('../quote', client), /Invalid/);
  const unavailable = {
    ...client,
    get: (async () => {
      throw new Error('storage unavailable');
    }) as typeof get,
  };
  assert.equal(await writeSnapshot('quote', envelope('2026-10-13T06:00:00Z'), unavailable), false);
  const huge = { ...envelope('2026-10-13T06:00:00Z'), data: 'x'.repeat(5_000_001) };
  assert.equal(await writeSnapshot('quote', huge, client), false);
});

test('concurrent first writers accept identical saved content without changing its retrieval time', async () => {
  const incoming = envelope('2026-10-13T08:00:00Z');
  const winner = {
    ...incoming,
    meta: { ...incoming.meta, fetchedAt: '2026-10-13T07:59:59Z' },
  };
  let reads = 0;
  const client = {
    get: (async () => (++reads === 1 ? null : result(JSON.stringify(winner)))) as typeof get,
    put: (async () => {
      throw new Error('Already exists');
    }) as typeof put,
  };
  assert.equal(await writeSnapshot('quote', incoming, client), true);
  assert.equal(
    JSON.parse((await readSnapshot('quote', client))!).meta.fetchedAt,
    winner.meta.fetchedAt,
  );
});
