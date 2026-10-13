import type { Metadata } from 'next';
import { RashifalView } from '@/components/rashifal-view';
import { getRashifal } from '@/lib/sources';
export const metadata: Metadata = { title: 'Daily rashifal' };
export const dynamic = 'force-dynamic';
export default async function RashifalPage() {
  const initial = await getRashifal().catch(() => null);
  return (
    <RashifalView
      initial={initial}
      initialError={initial ? undefined : 'Daily readings could not load. Try again to reconnect.'}
    />
  );
}
