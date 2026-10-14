import { SourceError } from '../contracts';

export async function fetchSource(url: string): Promise<string> {
  try {
    const options: RequestInit = {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
      redirect: 'manual',
      headers: {
        Accept: 'text/html, application/json',
        'Accept-Language': 'ne-NP,ne;q=0.9,en;q=0.5',
        'User-Agent': 'KhullaPatro/0.1 (local calendar and Nepal benchmark reader)',
      },
    };
    let response = await fetch(url, options);
    if (response.status >= 300 && response.status < 400) {
      const original = new URL(url);
      const location = response.headers.get('location');
      const target = location ? new URL(location, original) : null;
      // Hamro's regional edge can add /en to calendar routes; its JSON still includes Nepali fields.
      const samePath = target?.pathname.replace(/\/$/, '') === original.pathname.replace(/\/$/, '');
      const calendarLocale =
        original.origin === 'https://www.hamropatro.com' &&
        /^\/calendar\/\d{4}\/(?:[1-9]|1[0-2])\/?$/.test(original.pathname) &&
        target?.pathname.replace(/\/$/, '') === `/en${original.pathname.replace(/\/$/, '')}`;
      // One known canonical/locale redirect, never a login/challenge or another origin.
      const canonical =
        target &&
        target.href !== original.href &&
        target.protocol === 'https:' &&
        target.origin === original.origin &&
        (samePath || calendarLocale) &&
        target.search === original.search &&
        !target.hash &&
        !target.username &&
        !target.password;
      await response.body?.cancel();
      if (canonical) response = await fetch(target.href, options);
      else
        console.error('Declined upstream redirect', {
          url,
          destination: target ? `${target.origin}${target.pathname}` : null,
          queryChanged: target ? target.search !== original.search : false,
        });
    }
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
