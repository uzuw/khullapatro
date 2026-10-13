import type { Metadata } from 'next';
import { MarketView } from '@/components/market-view';
import { getMetals } from '@/lib/sources';
export const metadata: Metadata = { title: 'Gold & silver' };
export const dynamic = 'force-dynamic';
export default async function MetalsPage() {
  const initial = await getMetals().catch(() => null);
  return (
    <MarketView
      initial={initial}
      initialError={
        initial ? undefined : 'Metals data could not load. Try again to reconnect to the source.'
      }
    />
  );
}
