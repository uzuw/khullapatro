import { z } from 'zod';

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((key) => {
    const date = new Date(`${key}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key;
  }, 'Invalid Gregorian date');
const text = z.string().trim().min(1).max(10000);
const bsSchema = z.object({
  year: z.number().int().min(1900).max(2200),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(32),
});
export const calendarDaySchema = z.object({
  bs: bsSchema,
  ad: dateKeySchema,
  weekday: z.number().int().min(0).max(6),
  inMonth: z.boolean(),
  tithi: text.nullable(),
  tithiShifted: z.boolean(),
  isWeekendHoliday: z.boolean(),
  isHoliday: z.boolean(),
  events: z
    .array(z.object({ titleNp: text, titleEn: text.nullable(), isHoliday: z.boolean() }))
    .max(100),
});
export const calendarSchema = z
  .object({
    yearBs: z.number().int().min(2000).max(2100),
    monthBs: z.number().int().min(1).max(12),
    monthNameNp: text,
    monthNameEn: text,
    daysInMonth: z.number().int().min(28).max(32),
    supportedYears: z.object({ min: z.literal(2000), max: z.literal(2100) }),
    days: z.array(calendarDaySchema).min(28).max(42),
  })
  .superRefine((month, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const inside = month.days.filter((day) => day.inMonth);
    if (
      inside.length !== month.daysInMonth ||
      inside.some((day, index) => day.bs.day !== index + 1)
    )
      fail('Noncontiguous BS month');
    if (month.days.length % 7 !== 0) fail('Incomplete calendar grid');
    month.days.forEach((day, index) => {
      const actualWeekday = new Date(`${day.ad}T00:00:00Z`).getUTCDay();
      if (day.weekday !== actualWeekday || day.weekday !== index % 7)
        fail('Incorrect weekday position');
      if (day.inMonth !== (day.bs.year === month.yearBs && day.bs.month === month.monthBs))
        fail('Incorrect inMonth flag');
      if (index > 0 && Date.parse(day.ad) - Date.parse(month.days[index - 1].ad) !== 86400000)
        fail('Noncontiguous AD dates');
    });
    if (
      new Set(month.days.map((day) => `${day.bs.year}/${day.bs.month}/${day.bs.day}`)).size !==
      month.days.length
    )
      fail('Duplicate BS dates');
  });
export const signSlugs = [
  'mesh',
  'brish',
  'mithun',
  'karkat',
  'singha',
  'kanya',
  'tula',
  'brischik',
  'dhanu',
  'makar',
  'kumbha',
  'meen',
] as const;
export const rashifalSchema = z
  .object({
    period: z.literal('daily'),
    readingDateAd: dateKeySchema.nullable(),
    readingDateLabelNp: text,
    signs: z
      .array(
        z.object({
          slug: z.enum(signSlugs),
          nameNp: text,
          nameEn: text,
          symbol: text,
          textNp: text,
          textEn: text.nullable(),
        }),
      )
      .length(12),
  })
  .refine((data) => new Set(data.signs.map((sign) => sign.slug)).size === 12, 'Duplicate signs');
export const quoteSchema = z
  .object({
    date: dateKeySchema,
    gold: z.number().finite().positive().nullable(),
    silver: z.number().finite().positive().nullable(),
  })
  .refine((quote) => quote.gold !== null || quote.silver !== null, 'Empty quote');
export const metalsSchema = z.object({
  currency: z.literal('NPR'),
  unit: z.literal('tola'),
  goldPurity: z.literal('fine/hallmark'),
  quote: quoteSchema.nullable(),
  previousQuote: quoteSchema.nullable(),
  history: z.array(quoteSchema).max(1000),
  historyMeta: z.object({
    sourceUrl: z.string().url(),
    fetchedAt: z.string().datetime().nullable(),
    status: z.enum(['fresh', 'stale', 'unavailable']),
    startDate: dateKeySchema.nullable(),
    endDate: dateKeySchema.nullable(),
  }),
});
export const warningSchema = z.object({ code: z.string(), message: z.string() });
export const sourceMetaSchema = z.object({
  source: z.string(),
  sourceUrl: z.string().url(),
  nepalDate: dateKeySchema,
  sourceDate: dateKeySchema.nullable(),
  sourceRenderedAt: z.string().datetime().nullable(),
  fetchedAt: z.string().datetime(),
  checkedAt: z.string().datetime(),
  status: z.enum(['fresh', 'stale']),
  servedFrom: z.enum(['upstream', 'memory', 'snapshot']),
  warnings: z.array(warningSchema),
});
export type CalendarDay = z.infer<typeof calendarDaySchema>;
export type CalendarData = z.infer<typeof calendarSchema>;
export type RashifalData = z.infer<typeof rashifalSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type MetalsData = z.infer<typeof metalsSchema>;
export type SourceMeta = z.infer<typeof sourceMetaSchema>;
export type SourceWarning = z.infer<typeof warningSchema>;
export type Envelope<T> = { schemaVersion: 1; data: T; meta: SourceMeta };

export class SourceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = true,
  ) {
    super(message);
    this.name = 'SourceError';
  }
}
