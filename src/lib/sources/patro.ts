import { z } from 'zod';
import { cached } from '../cache';
import {
  calendarSchema,
  dateKeySchema,
  rashifalSchema,
  signSlugs,
  SourceError,
  type CalendarData,
  type SourceWarning,
} from '../contracts';
import { nepalDate } from '../date';
import { extractBootstrap, fetchSource } from './http';

const text = z.string().trim().min(1).max(10000);
const optionalText = z.string().max(10000).nullable().optional();
const integer = z.number().int();
const rawDay = z.object({
  year_ad: integer,
  month_ad: integer.min(1).max(12),
  day_ad: integer.min(1).max(31),
  year_bs: integer.min(1900).max(2200),
  month_bs: integer.min(1).max(12),
  day_bs: integer.min(1).max(32),
  dayOfWeek: integer.min(0).max(6),
  inMonth: z.boolean(),
  tithiShort: optionalText,
  tithiShifted: z.boolean(),
  isWeekendHoliday: z.boolean(),
  isHoliday: z.boolean(),
  patroEvent: z
    .object({
      items: z
        .array(z.object({ titleNp: text, titleEn: optionalText, isHoliday: z.boolean() }))
        .max(100),
    })
    .nullable(),
});
const rawMonth = z.object({
  yearBs: integer,
  monthBs: integer.min(1).max(12),
  monthNameNp: text,
  monthNameEn: text,
  daysInMonth: integer,
  days: z.array(rawDay).max(42),
});
const todaySchema = z
  .object({
    adKey: dateKeySchema,
    year_ad: integer,
    month_ad: integer,
    date_ad: integer,
    year_bs: integer,
    month_bs: integer.min(1).max(12),
    date_bs: integer.min(1).max(32),
  })
  .refine(
    (today) => today.adKey === adKey(today.year_ad, today.month_ad, today.date_ad),
    'Source Today AD date mismatch',
  );
const renderedAtSchema = z
  .number()
  .finite()
  .positive()
  .refine((value) => Number.isFinite(new Date(value).getTime()));
const emptyToNull = (value: string | null | undefined) => value?.trim() || null;
function adKey(year: number, month: number, day: number) {
  return dateKeySchema.parse(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );
}

export function parseCalendar(
  html: string,
  year?: number,
  month?: number,
  currentDate = nepalDate(),
) {
  const raw = z
    .object({
      renderedAt: renderedAtSchema,
      today: todaySchema,
      data: z.object({
        calendar: z.object({
          initialMonths: z.array(rawMonth).min(1).max(5),
          initialIndex: integer.min(0),
        }),
      }),
    })
    .parse(extractBootstrap(html));
  const months = raw.data.calendar.initialMonths;
  let selected;
  if (year !== undefined && month !== undefined)
    selected = months.find((value) => value.yearBs === year && value.monthBs === month);
  else {
    const mapping = months
      .flatMap((value) => value.days)
      .find((day) => adKey(day.year_ad, day.month_ad, day.day_ad) === currentDate);
    if (!mapping)
      throw new SourceError(
        502,
        'SOURCE_UNAVAILABLE',
        'The source does not provide a verified mapping for today.',
      );
    selected = months.find(
      (value) => value.yearBs === mapping.year_bs && value.monthBs === mapping.month_bs,
    );
  }
  if (!selected)
    throw new SourceError(
      502,
      'SOURCE_UNAVAILABLE',
      'The source returned a different calendar month.',
    );
  const data: CalendarData = calendarSchema.parse({
    yearBs: selected.yearBs,
    monthBs: selected.monthBs,
    monthNameNp: selected.monthNameNp,
    monthNameEn: selected.monthNameEn,
    daysInMonth: selected.daysInMonth,
    supportedYears: { min: 2000, max: 2100 },
    days: selected.days.map((day) => ({
      bs: { year: day.year_bs, month: day.month_bs, day: day.day_bs },
      ad: adKey(day.year_ad, day.month_ad, day.day_ad),
      weekday: day.dayOfWeek,
      inMonth: day.inMonth,
      tithi: emptyToNull(day.tithiShort),
      tithiShifted: day.tithiShifted,
      isWeekendHoliday: day.isWeekendHoliday,
      isHoliday: day.isHoliday,
      events: (day.patroEvent?.items || []).map((event) => ({
        titleNp: event.titleNp,
        titleEn: emptyToNull(event.titleEn),
        isHoliday: event.isHoliday,
      })),
    })),
  });
  return {
    data,
    sourceDate: raw.today.adKey,
    sourceRenderedAt: new Date(raw.renderedAt).toISOString(),
  };
}

const monthAliases = [
  ['वैशाख', 'बैशाख'],
  ['ज्येष्ठ', 'जेठ'],
  ['आषाढ', 'असार'],
  ['श्रावण', 'साउन'],
  ['भाद्र', 'भाद्रपद', 'भदौ'],
  ['आश्विन', 'असोज'],
  ['कार्तिक', 'कात्तिक'],
  ['मार्गशीर्ष', 'मंसिर'],
  ['पौष', 'पुस'],
  ['माघ'],
  ['फाल्गुन', 'फागुन'],
  ['चैत्र', 'चैत'],
];
export const nepaliToAscii = (value: string) =>
  value.replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)));

export function parseRashifal(html: string) {
  const raw = z
    .object({
      renderedAt: renderedAtSchema,
      today: todaySchema,
      data: z.object({
        period: z.literal('daily'),
        rashifal: z.object({
          date: text,
          signs: z
            .array(
              z.object({
                slug: z.enum(signSlugs),
                np: text,
                en: text,
                emoji: text,
                descNp: text,
                descEn: optionalText,
              }),
            )
            .length(12),
        }),
      }),
    })
    .parse(extractBootstrap(html));
  const label = nepaliToAscii(raw.data.rashifal.date).replace(/\s+/g, ' ').trim();
  const match = label.match(/^(\d{1,2}) ([^\d\s]+) (\d{4})(?:\s+(.+))?$/);
  const weekdays = [
    ['आइतवार', 'आइतबार'],
    ['सोमवार', 'सोमबार'],
    ['मंगलवार', 'मङ्गलवार', 'मंगलबार'],
    ['बुधवार', 'बुधबार'],
    ['बिहिवार', 'बिहीवार', 'बिहीबार'],
    ['शुक्रवार', 'शुक्रबार'],
    ['शनिवार', 'शनिबार'],
  ];
  const labelAgrees =
    match &&
    Number(match[1]) === raw.today.date_bs &&
    Number(match[3]) === raw.today.year_bs &&
    monthAliases[raw.today.month_bs - 1].includes(match[2]) &&
    (!match[4] ||
      weekdays[new Date(`${raw.today.adKey}T00:00:00Z`).getUTCDay()].includes(match[4]));
  const readingDateAd = labelAgrees ? raw.today.adKey : null;
  const data = rashifalSchema.parse({
    period: raw.data.period,
    readingDateAd,
    readingDateLabelNp: raw.data.rashifal.date,
    signs: raw.data.rashifal.signs.map((sign) => ({
      slug: sign.slug,
      nameNp: sign.np,
      nameEn: sign.en,
      symbol: sign.emoji,
      textNp: sign.descNp,
      textEn: emptyToNull(sign.descEn),
    })),
  });
  const warnings: SourceWarning[] = readingDateAd
    ? []
    : [
        {
          code: 'READING_DATE_UNVERIFIED',
          message: 'The reading date label does not match the source date mapping.',
        },
      ];
  return {
    data,
    sourceDate: readingDateAd,
    sourceRenderedAt: new Date(raw.renderedAt).toISOString(),
    warnings,
  };
}

export async function getCalendar(year?: number, month?: number) {
  const explicit = year !== undefined || month !== undefined;
  if (
    explicit &&
    (!Number.isInteger(year) ||
      !Number.isInteger(month) ||
      year! < 2000 ||
      year! > 2100 ||
      month! < 1 ||
      month! > 12)
  )
    throw new SourceError(
      400,
      'INVALID_REQUEST',
      'Supply both a BS year from 2000 to 2100 and a month from 1 to 12.',
      false,
    );
  const sourceUrl = explicit
    ? `https://www.hamropatro.com/calendar/${year}/${month}`
    : 'https://www.hamropatro.com/';
  const schema = explicit
    ? calendarSchema.refine(
        (value) => value.yearBs === year && value.monthBs === month,
        'Wrong cached month',
      )
    : calendarSchema;
  const result = await cached({
    key: explicit ? `calendar-${year}-${month}` : 'calendar-current',
    source: 'Hamro Patro',
    sourceUrl,
    schema,
    ttl: explicit ? 86400000 : 3600000,
    rollover: !explicit,
    load: async () => parseCalendar(await fetchSource(sourceUrl), year, month),
  });
  if (
    !explicit &&
    !result.data.days.some((day) => day.inMonth && day.ad === result.meta.nepalDate)
  ) {
    const mapped = result.data.days.find((day) => day.ad === result.meta.nepalDate);
    if (mapped && mapped.bs.year >= 2000 && mapped.bs.year <= 2100)
      return getCalendar(mapped.bs.year, mapped.bs.month);
    result.meta.status = 'stale';
    result.meta.warnings.push({
      code: 'CURRENT_MONTH_UNVERIFIED',
      message: 'Showing a saved month. The current BS month could not be verified.',
    });
  }
  return result;
}

export function getRashifal() {
  const sourceUrl = 'https://www.hamropatro.com/rashifal';
  return cached({
    key: 'rashifal-daily',
    source: 'Hamro Patro',
    sourceUrl,
    schema: rashifalSchema,
    ttl: 900000,
    daily: true,
    rollover: true,
    load: async () => parseRashifal(await fetchSource(sourceUrl)),
  });
}
