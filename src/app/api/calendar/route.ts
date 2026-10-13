import { z } from 'zod';
import { getCalendar } from '@/lib/sources';
import { apiResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';
const selection = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number)
    .pipe(z.number().int().min(2000).max(2100)),
  month: z
    .string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(12)),
});
export async function GET(request: Request) {
  return apiResponse(async () => {
    const query = new URL(request.url).searchParams;
    if (!query.has('year') && !query.has('month')) return getCalendar();
    const { year, month } = selection.parse({ year: query.get('year'), month: query.get('month') });
    return getCalendar(year, month);
  });
}
