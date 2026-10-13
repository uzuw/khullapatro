'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Flag,
  Moon,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageMotion } from '@/components/shell';
import { DataNotice, PageHeading, SourceNote, Unavailable } from '@/components/shared';
import { useData } from '@/hooks/use-data';
import { bsMonths, formatDate, np, shiftMonth, weekdays } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { CalendarData, CalendarDay, Envelope } from '@/lib/contracts';

export function CalendarView({
  initial,
  initialError,
  initialUrl = '/api/calendar',
}: {
  initial: Envelope<CalendarData> | null;
  initialError?: string;
  initialUrl?: string;
}) {
  const { data, error, loading, load } = useData(initial, initialUrl, initialError);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);
  const month = data?.data;
  const selected =
    month?.days.find((d) => d.ad === selectedAd) ??
    month?.days.find((d) => d.ad === data?.meta.nepalDate) ??
    month?.days.find((d) => d.inMonth);
  const showMonth = (year: number, m: number) => {
    setSelectedAd(null);
    void load(`/api/calendar?year=${year}&month=${m}`);
  };
  const pick = (day: CalendarDay) => setSelectedAd(day.ad);
  const retry = () => void load();
  const prev = month ? shiftMonth(month.yearBs, month.monthBs, -1) : null;
  const next = month ? shiftMonth(month.yearBs, month.monthBs, 1) : null;
  const eventCount =
    month?.days.filter((d) => d.inMonth).reduce((n, d) => n + d.events.length, 0) ?? 0;
  const eventDays =
    month?.days
      .filter((d) => d.inMonth && d.events.length && d.ad >= (selected?.ad ?? ''))
      .slice(0, 3) ?? [];

  return (
    <PageMotion>
      <PageHeading
        title="Your days, clearly."
        subtitle="A Nepali calendar with room for what matters."
        art="mountains"
        note="नेपाली पात्रो"
      />
      <DataNotice error={error} meta={data?.meta} retry={retry} loading={loading} />
      {!month || !data ? (
        <Unavailable error={error} retry={retry} loading={loading} />
      ) : (
        <>
          <div className="calendar-layout">
            <section
              className={cn('calendar-panel', loading && 'is-loading')}
              aria-label="Nepali month calendar"
              aria-busy={loading}
            >
              <div className="calendar-toolbar">
                <div>
                  <h2 lang="ne" className="np month-heading">
                    {month.monthNameNp} <span>{np(month.yearBs)}</span>
                  </h2>
                  <p>
                    {month.monthNameEn} <span className="mx-1">·</span>{' '}
                    {formatDate(month.days.find((d) => d.inMonth)!.ad)} –{' '}
                    {formatDate(month.days.filter((d) => d.inMonth).at(-1)!.ad)}
                  </p>
                </div>
                <div className="month-controls">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAd(null);
                      void load('/api/calendar');
                    }}
                    disabled={loading}
                    className="today-button"
                  >
                    Today{' '}
                    <span lang="ne" className="np ml-1">
                      आज
                    </span>
                  </Button>
                  <div className="arrow-controls">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Previous month"
                      disabled={loading || !prev || prev.year < month.supportedYears.min}
                      onClick={() => prev && showMonth(prev.year, prev.month)}
                    >
                      <ChevronLeft size={17} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Next month"
                      disabled={loading || !next || next.year > month.supportedYears.max}
                      onClick={() => next && showMonth(next.year, next.month)}
                    >
                      <ChevronRight size={17} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="calendar-selectors">
                <label>
                  Month{' '}
                  <select
                    aria-label="BS month"
                    value={month.monthBs}
                    disabled={loading}
                    onChange={(e) => showMonth(month.yearBs, Number(e.target.value))}
                  >
                    {bsMonths.map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Year{' '}
                  <select
                    aria-label="BS year"
                    value={month.yearBs}
                    disabled={loading}
                    onChange={(e) => showMonth(Number(e.target.value), month.monthBs)}
                  >
                    {Array.from(
                      { length: month.supportedYears.max - month.supportedYears.min + 1 },
                      (_, i) => month.supportedYears.min + i,
                    ).map((y) => (
                      <option key={y} value={y}>
                        {np(y)} BS
                      </option>
                    ))}
                  </select>
                </label>
                <span>{eventCount} occasions this month</span>
              </div>
              <div className="weekdays" aria-hidden="true">
                {weekdays.map((day, i) => (
                  <div key={day} className={cn(i === 6 && 'holiday')}>
                    <span lang="ne" className="np">
                      {day}
                    </span>
                    <small>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</small>
                  </div>
                ))}
              </div>
              <div className="calendar-grid">
                {month.days.map((day) => (
                  <button
                    key={day.ad}
                    type="button"
                    onClick={() => pick(day)}
                    disabled={loading}
                    aria-label={`${day.bs.day} ${bsMonths[day.bs.month - 1]} ${day.bs.year}, ${formatDate(day.ad)}${day.events.length ? ', ' + day.events.map((e) => e.titleNp).join(', ') : ', no events listed'}`}
                    aria-pressed={selected?.ad === day.ad}
                    className={cn(
                      'day-cell',
                      !day.inMonth && 'outside-month',
                      day.isHoliday && 'holiday',
                      day.ad === data.meta.nepalDate && 'is-today',
                      selected?.ad === day.ad && 'selected-day',
                    )}
                  >
                    <div className="day-top">
                      <span lang="ne" className="np bs-number">
                        {np(day.bs.day)}
                      </span>
                      <span className="ad-number">
                        {Number(day.ad.slice(8))}
                        {day.ad === data.meta.nepalDate ? <span className="today-dot" /> : null}
                      </span>
                    </div>
                    <div lang="ne" className="np cell-tithi">
                      {day.tithi}
                      {day.tithiShifted ? '*' : ''}
                    </div>
                    <div className="cell-events">
                      {day.events.slice(0, 2).map((event, i) => (
                        <span key={i} lang="ne" className="np cell-event">
                          {event.titleNp}
                        </span>
                      ))}
                      {day.events.length > 2 ? (
                        <span className="more-events">+{day.events.length - 2} more</span>
                      ) : null}
                    </div>
                    {day.events.length ? (
                      <span className="mobile-events" aria-hidden="true">
                        {day.events.length} <Circle size={4} fill="currentColor" />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="calendar-legend">
                <span>
                  <i className="legend-today" /> Today
                </span>
                <span>
                  <i className="legend-holiday" /> Holiday / Saturday
                </span>
                <span>Click a date for every event</span>
              </div>
            </section>
            <aside className="day-detail" aria-label="Selected date details" aria-live="polite">
              {selected ? (
                <>
                  <div className="detail-header">
                    <span>
                      {selected.ad === data.meta.nepalDate ? 'Today in Nepal' : 'Selected date'}
                    </span>
                    <CalendarDays size={17} />
                  </div>
                  <div className="detail-date">
                    <span lang="ne" className="np detail-number">
                      {np(selected.bs.day)}
                    </span>
                    <div>
                      <h3 lang="ne" className="np">
                        {bsMonths[selected.bs.month - 1]} {np(selected.bs.year)}
                      </h3>
                      <p lang="ne" className="np">
                        {weekdays[selected.weekday]}
                      </p>
                      <span>{formatDate(selected.ad)}</span>
                    </div>
                  </div>
                  <div className="detail-tithi">
                    <Moon size={15} />
                    <span lang="ne" className="np">
                      {selected.tithi ?? 'तिथि उपलब्ध छैन'}
                      {selected.tithiShifted ? ' *' : ''}
                    </span>
                    {selected.isHoliday ? (
                      <span className="holiday-badge">
                        {selected.isWeekendHoliday ? 'Weekend' : 'Holiday'}
                      </span>
                    ) : null}
                  </div>
                  <div className="detail-events">
                    <h4>
                      On this day <span>{selected.events.length}</span>
                    </h4>
                    {selected.events.length ? (
                      <ul>
                        {selected.events.map((event, i) => (
                          <li key={i}>
                            <span className={cn('event-dot', event.isHoliday && 'holiday-event')} />
                            <div>
                              <p lang="ne" className="np">
                                {event.titleNp}
                              </p>
                              {event.titleEn ? <small>{event.titleEn}</small> : null}
                              {event.isHoliday ? (
                                <span className="event-holiday">
                                  <Flag size={10} /> Source-listed holiday
                                </span>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-events">
                        No events listed for this date.
                        <br />
                        <span>A little room to make your own day.</span>
                      </p>
                    )}
                  </div>
                  <div className="detail-bottom">
                    {selected.events.some((e) => e.isHoliday)
                      ? 'Holiday scope follows the source; regional details are preserved above.'
                      : 'Festivals and observances from Hamro Patro.'}
                  </div>
                </>
              ) : null}
            </aside>
          </div>
          <SourceNote meta={data.meta} />
          {eventDays.length ? (
            <section className="month-occasions">
              <div className="section-title">
                <h2>More in this month</h2>
                <span>From the selected date</span>
              </div>
              <div className="occasion-grid">
                {eventDays.map((day) => (
                  <button key={day.ad} onClick={() => pick(day)} className="occasion">
                    <div className="occasion-date np">
                      {np(day.bs.day)}
                      <span>{bsMonths[day.bs.month - 1]}</span>
                    </div>
                    <div>
                      <h3 lang="ne" className="np">
                        {day.events[0].titleNp}
                      </h3>
                      <p>
                        {formatDate(day.ad)}
                        {day.events.length > 1 ? ` · ${day.events.length} events` : ''}
                      </p>
                    </div>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <div className="section-crosslinks">
            <Link href="/rashifal">
              <SparkleIcon /> Your daily rashifal <ArrowUpRight size={15} />
            </Link>
            <Link href="/metals">
              <Circle size={15} /> Gold & silver rates <ArrowUpRight size={15} />
            </Link>
          </div>
        </>
      )}
    </PageMotion>
  );
}
function SparkleIcon() {
  return (
    <span aria-hidden="true" className="text-lg">
      ✧
    </span>
  );
}
