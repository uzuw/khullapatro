'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>This page could not load.</h1>
      <p>Try again to reconnect to OpenPatro.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
