'use client';

import Image from 'next/image';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, nepalDate } from '@/lib/date';
import type { SourceMeta } from '@/lib/contracts';

export function PageHeading({
  title,
  subtitle,
  art,
  note,
}: {
  title: string;
  subtitle: string;
  art: 'mountains' | 'moon' | 'metals';
  note: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <p lang="ne" className="heading-note">
          {note}
        </p>
        <h1>{title}</h1>
        <p className="heading-subtitle">{subtitle}</p>
      </div>
      <div className={`heading-art art-${art}`}>
        <Image
          src={`/art/${art}.svg`}
          alt=""
          fill
          sizes="(max-width: 700px) 180px, 330px"
          priority
        />
        <span className="art-caption">
          {art === 'mountains'
            ? 'A quieter view of home'
            : art === 'moon'
              ? 'A moment to reflect'
              : 'Value, over time'}
        </span>
      </div>
    </div>
  );
}

export function SourceNote({ meta }: { meta: SourceMeta }) {
  return (
    <div className="source-note">
      <span className={`source-dot ${meta.status === 'stale' ? 'stale' : ''}`} />
      <span>
        {meta.status === 'stale' ? 'Saved or older source data' : 'Source checked'}{' '}
        <span className="mx-1">·</span>{' '}
        <a href={meta.sourceUrl} target="_blank" rel="noreferrer">
          {meta.source} <ExternalLink size={10} className="inline" />
        </a>
      </span>
      <span className="source-retrieved">
        Retrieved {formatDate(nepalDate(new Date(meta.fetchedAt)))}
      </span>
    </div>
  );
}

export function DataNotice({
  error,
  meta,
  retry,
  loading,
}: {
  error?: string | null;
  meta?: SourceMeta;
  retry: () => void;
  loading?: boolean;
}) {
  const warnings = meta?.warnings ?? [];
  if (!error && !warnings.length && meta?.status !== 'stale') return null;
  return (
    <div className="data-notice" role="status">
      <AlertCircle size={16} className="shrink-0" />
      <span>
        {error ??
          (warnings.length
            ? warnings.map((w) => w.message).join(' ')
            : 'This is saved source data. Its original dates are preserved.')}
      </span>
      <Button variant="ghost" size="sm" onClick={retry} disabled={loading}>
        <RefreshCw size={13} />
        Retry
      </Button>
    </div>
  );
}

export function Unavailable({
  error,
  retry,
  loading,
}: {
  error: string | null;
  retry: () => void;
  loading: boolean;
}) {
  return (
    <div className="empty-state" role="status">
      <CalendarPlaceholder />
      <h2>{loading ? 'Getting your dates…' : 'Source data is unavailable'}</h2>
      <p>
        {loading
          ? 'Loading the latest available source.'
          : (error ?? 'Try loading this section again.')}
      </p>
      {!loading ? (
        <Button variant="outline" onClick={retry}>
          <RefreshCw size={15} /> Try again
        </Button>
      ) : null}
    </div>
  );
}
function CalendarPlaceholder() {
  return (
    <div className="empty-icon">
      <RefreshCw size={24} />
    </div>
  );
}
