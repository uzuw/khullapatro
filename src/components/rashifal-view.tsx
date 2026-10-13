'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { DataNotice, PageHeading, SourceNote, Unavailable } from '@/components/shared';
import { PageMotion } from '@/components/shell';
import { useData } from '@/hooks/use-data';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Envelope, RashifalData } from '@/lib/contracts';

export function RashifalView({
  initial,
  initialError,
}: {
  initial: Envelope<RashifalData> | null;
  initialError?: string;
}) {
  const { data, error, loading, load } = useData(initial, '/api/rashifal', initialError);
  const [chosen, setChosen] = useState('mesh');
  const sign = data?.data.signs.find((s) => s.slug === chosen) ?? data?.data.signs[0];
  const reduce = useReducedMotion();
  const retry = () => void load();
  return (
    <PageMotion>
      <PageHeading
        title="A moment for you."
        subtitle="Your daily rashifal. Choose your sign, take a breath."
        art="moon"
        note="दैनिक राशिफल"
      />
      <DataNotice error={error} meta={data?.meta} retry={retry} loading={loading} />
      {!data || !sign ? (
        <Unavailable error={error} retry={retry} loading={loading} />
      ) : (
        <>
          <div className="reading-date">
            <span lang="ne" className="np">
              {data.data.readingDateLabelNp}
            </span>
            {data.data.readingDateAd ? <span>{formatDate(data.data.readingDateAd)}</span> : null}
            <span className="period-tag">Daily reading</span>
          </div>
          <div className="rashifal-layout">
            <section className="sign-picker" aria-label="Choose your zodiac sign">
              <div className="section-title">
                <h2>Your sign</h2>
                <span>१२ राशि</span>
              </div>
              <div className="sign-grid">
                {data.data.signs.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    aria-label={`Choose ${s.nameEn}`}
                    aria-pressed={s.slug === sign.slug}
                    onClick={() => setChosen(s.slug)}
                    className={cn('sign-button', s.slug === sign.slug && 'chosen-sign')}
                  >
                    <span className="sign-symbol" aria-hidden="true">
                      {s.symbol + '\uFE0E'}
                    </span>
                    <span lang="ne" className="np sign-np">
                      {s.nameNp}
                    </span>
                    <span className="sign-en">{s.nameEn}</span>
                  </button>
                ))}
              </div>
            </section>
            <section
              className="reading-panel"
              aria-label="Daily reading"
              aria-live="polite"
              aria-busy={loading}
            >
              <div className="reading-top">
                <Sparkles size={18} />
                <span>Daily rashifal</span>
                <span className="reading-date-mini">
                  {data.data.readingDateAd
                    ? formatDate(data.data.readingDateAd)
                    : 'Source date above'}
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={sign.slug}
                  initial={reduce ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.16 }}
                >
                  <div className="reading-sign">
                    <span className="reading-symbol" aria-hidden="true">
                      {sign.symbol + '\uFE0E'}
                    </span>
                    <div>
                      <h2 lang="ne" className="np">
                        {sign.nameNp}
                      </h2>
                      <p>{sign.nameEn}</p>
                    </div>
                  </div>
                  <p lang="ne" className="np reading-text">
                    {sign.textNp}
                  </p>
                  {sign.textEn ? <p className="reading-text-en">{sign.textEn}</p> : null}
                </motion.div>
              </AnimatePresence>
              <div className="reading-bottom">
                <span>One reading, one day.</span>
                <span lang="ne" className="np">
                  शुभ दिनको कामना।
                </span>
              </div>
            </section>
          </div>
          <SourceNote meta={data.meta} />
          <div className="section-crosslinks">
            <Link href="/">
              Back to the calendar <ArrowUpRight size={15} />
            </Link>
            <Link href="/metals">
              Explore gold & silver <ArrowUpRight size={15} />
            </Link>
          </div>
        </>
      )}
    </PageMotion>
  );
}
