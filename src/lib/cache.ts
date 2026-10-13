import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { nepalDate } from './date';
import { type Envelope, type SourceWarning, SourceError, sourceMetaSchema } from './contracts';

type Loaded<T> = {
  data: T;
  sourceDate: string | null;
  sourceRenderedAt: string | null;
  warnings?: SourceWarning[];
};
type CacheOptions<T> = {
  key: string;
  source: string;
  sourceUrl: string;
  schema: z.ZodType<T>;
  ttl: number;
  daily?: boolean;
  rollover?: boolean;
  load: () => Promise<Loaded<T>>;
};
const memory = new Map<string, Envelope<unknown>>();
const inflight = new Map<string, Promise<Envelope<unknown>>>();
const failures = new Map<string, { until: number; error: SourceError }>();
const directory = () =>
  process.env.KHULLAPATRO_CACHE_DIR || join(process.cwd(), '.cache', 'KhullaPatro');

async function persist(key: string, value: Envelope<unknown>) {
  const dir = directory();
  const temporary = join(dir, `${key}.${randomUUID()}.tmp`);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
    await rename(temporary, join(dir, `${key}.json`));
    return true;
  } catch {
    await unlink(temporary).catch(() => {});
    return false;
  }
}

export async function cached<T>(options: CacheOptions<T>): Promise<Envelope<T>> {
  if (!/^[a-z0-9-]+$/.test(options.key)) throw new Error('Invalid internal cache key');
  const flight = inflight.get(options.key);
  if (flight) return flight as Promise<Envelope<T>>;
  const work = refresh(options);
  inflight.set(options.key, work);
  try {
    return await work;
  } finally {
    inflight.delete(options.key);
  }
}

async function refresh<T>(options: CacheOptions<T>): Promise<Envelope<T>> {
  const now = new Date();
  const today = nepalDate(now);
  const schema = z.object({
    schemaVersion: z.literal(1),
    data: options.schema,
    meta: sourceMetaSchema,
  });
  let old = memory.get(options.key) as Envelope<T> | undefined;
  let from: 'memory' | 'snapshot' = 'memory';
  if (!old) {
    try {
      const raw = await readFile(join(directory(), `${options.key}.json`), 'utf8');
      if (raw.length > 5_000_000) throw new Error('Snapshot too large');
      old = schema.parse(JSON.parse(raw)) as Envelope<T>;
      if (
        old.meta.source !== options.source ||
        old.meta.sourceUrl !== options.sourceUrl ||
        Date.parse(old.meta.fetchedAt) > now.getTime()
      )
        old = undefined;
      else {
        memory.set(options.key, old);
        from = 'snapshot';
      }
    } catch {
      old = undefined;
    }
  }
  const render = (
    value: Envelope<T>,
    stale: boolean,
    checkedAt = value.meta.checkedAt,
    extra: SourceWarning[] = [],
  ): Envelope<T> => {
    const datedStale = !!options.daily && value.meta.sourceDate !== today;
    const warnings = [
      ...value.meta.warnings.filter((warning) => warning.code !== 'SOURCE_DATE_OLD'),
      ...extra,
    ];
    if (datedStale)
      warnings.push({
        code: 'SOURCE_DATE_OLD',
        message: value.meta.sourceDate
          ? `Source content is dated ${value.meta.sourceDate}.`
          : 'The source content date could not be verified.',
      });
    return {
      ...value,
      meta: {
        ...value.meta,
        nepalDate: today,
        checkedAt,
        servedFrom: from,
        status: stale || datedStale ? 'stale' : 'fresh',
        warnings,
      },
    };
  };
  const failure = failures.get(options.key);
  if (failure && now.getTime() < failure.until) {
    if (old) return render(old, true);
    throw failure.error;
  }
  const age = old ? now.getTime() - Date.parse(old.meta.fetchedAt) : Infinity;
  if (
    old &&
    age < options.ttl &&
    (!options.rollover || nepalDate(new Date(old.meta.fetchedAt)) === today)
  )
    return render(old, old.meta.status === 'stale');
  const checkedAt = now.toISOString();
  try {
    const loaded = await options.load();
    const value: Envelope<T> = {
      schemaVersion: 1,
      data: options.schema.parse(loaded.data),
      meta: {
        source: options.source,
        sourceUrl: options.sourceUrl,
        nepalDate: today,
        sourceDate: loaded.sourceDate,
        sourceRenderedAt: loaded.sourceRenderedAt,
        fetchedAt: new Date().toISOString(),
        checkedAt,
        status: 'fresh',
        servedFrom: 'upstream',
        warnings: loaded.warnings || [],
      },
    };
    schema.parse(value);
    from = 'memory';
    const response = render(value, false);
    response.meta.servedFrom = 'upstream';
    if (!(await persist(options.key, response)))
      response.meta.warnings.push({
        code: 'CACHE_NOT_PERSISTED',
        message: 'Saved fallback is unavailable after a server restart.',
      });
    memory.set(options.key, response);
    if (memory.size > 140) memory.delete(memory.keys().next().value!);
    failures.delete(options.key);
    return response;
  } catch (error) {
    const sourceError =
      error instanceof SourceError
        ? error
        : new SourceError(
            502,
            'SOURCE_UNAVAILABLE',
            'The source response could not be verified. Please try again shortly.',
          );
    failures.set(options.key, { until: now.getTime() + 60_000, error: sourceError });
    if (!old) throw sourceError;
    const stale = render(old, true, checkedAt, [
      {
        code: 'SOURCE_REFRESH_FAILED',
        message: 'Source refresh failed. Showing previously verified data.',
      },
    ]);
    memory.set(options.key, stale);
    await persist(options.key, stale);
    return stale;
  }
}

/** Clear process memory; persisted snapshots are left intact. */
export function clearCacheMemory() {
  memory.clear();
  inflight.clear();
  failures.clear();
}
