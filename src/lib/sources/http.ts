import { SourceError } from '../contracts';

export async function fetchSource(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
      redirect: 'error',
      headers: {
        Accept: 'text/html, application/json',
        'User-Agent': 'KhullaPatro/0.1 (local calendar and Nepal benchmark reader)',
      },
    });
    if (!response.ok) {
      if (response.status === 404 && url.includes('/calendar/'))
        throw new SourceError(
          404,
          'MONTH_UNAVAILABLE',
          'This calendar month is not available from the source.',
          false,
        );
      throw new SourceError(
        502,
        'SOURCE_UNAVAILABLE',
        'The source is temporarily unavailable. Please try again shortly.',
      );
    }
    if (Number(response.headers.get('content-length')) > 5_000_000)
      throw new SourceError(
        502,
        'SOURCE_UNAVAILABLE',
        'The source returned an unexpectedly large response.',
      );
    const reader = response.body?.getReader();
    if (!reader)
      throw new SourceError(502, 'SOURCE_UNAVAILABLE', 'The source returned an empty response.');
    const decoder = new TextDecoder();
    let size = 0;
    let body = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 5_000_000) {
          await reader.cancel();
          throw new SourceError(
            502,
            'SOURCE_UNAVAILABLE',
            'The source returned an unexpectedly large response.',
          );
        }
        body += decoder.decode(value, { stream: true });
      }
      return body + decoder.decode();
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof SourceError) throw error;
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
      throw new SourceError(
        504,
        'SOURCE_TIMEOUT',
        'The source took too long to respond. Please try again.',
      );
    const cause = error instanceof Error ? error.cause : undefined;
    console.error('Upstream transport failure', {
      url,
      error: error instanceof Error ? error.name : 'Unknown',
      cause: cause instanceof Error ? cause.message.slice(0, 160) : undefined,
    });
    throw new SourceError(
      502,
      'SOURCE_UNAVAILABLE',
      'Could not reach the source. Please try again shortly.',
    );
  }
}

export function extractBootstrap(html: string): unknown {
  const matches = [
    ...html.matchAll(/<script\b[^>]*\bid=["']hp-bootstrap["'][^>]*>([\s\S]*?)<\/script\s*>/gi),
  ];
  if (matches.length !== 1)
    throw new SourceError(502, 'SOURCE_UNAVAILABLE', 'The source page format has changed.');
  try {
    return JSON.parse(matches[0][1]);
  } catch {
    throw new SourceError(502, 'SOURCE_UNAVAILABLE', 'The source returned malformed page data.');
  }
}
