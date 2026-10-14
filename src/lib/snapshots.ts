import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { get, put } from '@vercel/blob';
import { type Envelope, sourceMetaSchema } from './contracts';

type BlobClient = { get: typeof get; put: typeof put };
const blobClient = { get, put };
const limit = 5_000_000;
const directory = () =>
  process.env.KHULLAPATRO_CACHE_DIR || join(process.cwd(), '.cache', 'KhullaPatro');
const storage = () =>
  process.env.KHULLAPATRO_CACHE_STORAGE || (process.env.VERCEL === '1' ? 'blob' : 'file');
const pathname = (key: string) => {
  if (!/^[a-z0-9-]+$/.test(key)) throw new Error('Invalid internal snapshot key');
  const environment = process.env.VERCEL_ENV === 'production' ? 'production' : 'nonproduction';
  return `snapshots/v1/${environment}/${key}.json`;
};

async function boundedText(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Snapshot too large');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    reader.releaseLock();
  }
}

export async function readSnapshot(key: string, client: BlobClient = blobClient) {
  const path = pathname(key);
  if (storage() === 'file') {
    const text = await readFile(join(directory(), `${key}.json`), 'utf8');
    if (Buffer.byteLength(text) > limit) throw new Error('Snapshot too large');
    return text;
  }
  if (storage() !== 'blob') throw new Error('Unknown snapshot storage');
  const result = await client.get(path, {
    access: 'private',
    useCache: false,
    abortSignal: AbortSignal.timeout(8_000),
  });
  if (!result) return null;
  if (result.statusCode !== 200) throw new Error('Unexpected snapshot response');
  if (result.blob.size > limit) {
    await result.stream.cancel();
    throw new Error('Snapshot too large');
  }
  return boundedText(result.stream);
}

export async function writeSnapshot(
  key: string,
  value: Envelope<unknown>,
  client: BlobClient = blobClient,
) {
  const path = pathname(key);
  const body = JSON.stringify(value);
  if (Buffer.byteLength(body) > limit) return false;
  if (storage() === 'blob') {
    try {
      const current = await client.get(path, {
        access: 'private',
        useCache: false,
        abortSignal: AbortSignal.timeout(8_000),
      });
      if (current && current.statusCode !== 200) return false;
      if (current?.statusCode === 200) {
        try {
          const saved = JSON.parse(await boundedText(current.stream));
          const savedAt = Date.parse(saved?.meta?.fetchedAt);
          // A slower concurrent refresh must not replace a newer successful snapshot.
          if (savedAt <= Date.now() && savedAt > Date.parse(value.meta.fetchedAt)) return true;
        } catch {
          /* Replace an unreadable snapshot only if its ETag still matches. */
        }
      }
      await client.put(path, body, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: !!current,
        ifMatch: current?.blob.etag,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
        abortSignal: AbortSignal.timeout(8_000),
      });
      return true;
    } catch {
      // Another cold instance may have saved the same validated content first.
      // Keep its actual retrieval timestamp instead of claiming our timestamp was saved.
      try {
        const raw = await readSnapshot(key, client);
        const saved = raw ? JSON.parse(raw) : null;
        const meta = sourceMetaSchema.safeParse(saved?.meta);
        return !!(
          saved?.schemaVersion === 1 &&
          meta.success &&
          Date.parse(meta.data.fetchedAt) <= Date.now() &&
          meta.data.source === value.meta.source &&
          meta.data.sourceUrl === value.meta.sourceUrl &&
          meta.data.sourceDate === value.meta.sourceDate &&
          JSON.stringify(saved.data) === JSON.stringify(value.data)
        );
      } catch {
        return false;
      }
    }
  }
  if (storage() !== 'file') return false;
  const dir = directory();
  const temporary = join(dir, `${key}.${randomUUID()}.tmp`);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(temporary, body, { mode: 0o600 });
    await rename(temporary, join(dir, `${key}.json`));
    return true;
  } catch {
    await unlink(temporary).catch(() => {});
    return false;
  }
}
