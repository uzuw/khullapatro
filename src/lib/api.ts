import { ZodError } from 'zod';
import { SourceError } from '@/lib/contracts';

export async function apiResponse<T>(get: () => Promise<T>) {
  try {
    return Response.json(await get(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const source = error instanceof SourceError ? error : null;
    const invalid = error instanceof ZodError;
    return Response.json(
      {
        error: {
          code: invalid ? 'INVALID_REQUEST' : (source?.code ?? 'SOURCE_UNAVAILABLE'),
          message: invalid
            ? 'Choose a valid BS year (2000–2100) and month (1–12).'
            : (source?.message ?? 'Source data is unavailable. Please try again.'),
          retryable: invalid ? false : (source?.retryable ?? true),
        },
      },
      { status: invalid ? 400 : (source?.status ?? 502), headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
