'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Envelope } from '@/lib/contracts';
import { nepalDate } from '@/lib/date';

export function useData<T>(initial: Envelope<T> | null, initialUrl: string, initialError?: string) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const url = useRef(initialUrl);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const today = useRef('');
  const checked = useRef(0);
  const load = useCallback(async (nextUrl?: string) => {
    const request = ++sequence.current;
    controller.current?.abort();
    const signal = new AbortController();
    controller.current = signal;
    setLoading(true);
    setError(null);
    try {
      const requestedUrl = nextUrl ?? url.current;
      const response = await fetch(requestedUrl, { signal: signal.signal, cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? 'Could not load this section.');
      if (request !== sequence.current) return;
      url.current = requestedUrl;
      checked.current = Date.now();
      setData(body as Envelope<T>);
    } catch (failure) {
      if (!signal.signal.aborted && request === sequence.current)
        setError(failure instanceof Error ? failure.message : 'Could not load source data.');
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    today.current = nepalDate();
    checked.current = Date.now();
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      const current = nepalDate();
      if (current !== today.current || Date.now() - checked.current > 15 * 60_000) {
        today.current = current;
        void load();
      }
    };
    document.addEventListener('visibilitychange', refresh);
    const timer = setInterval(refresh, 60_000);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      controller.current?.abort();
    };
  }, [load]);
  return { data, error, loading, load };
}
