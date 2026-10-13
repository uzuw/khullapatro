import { CalendarView } from '@/components/calendar-view';
import { getCalendar } from '@/lib/sources';

export const dynamic = 'force-dynamic';
export default async function CalendarPage() {
  const initial = await getCalendar().catch(() => null);
  return (
    <CalendarView
      initial={initial}
      initialError={
        initial ? undefined : 'The calendar source could not load. Try again to reconnect.'
      }
    />
  );
}
