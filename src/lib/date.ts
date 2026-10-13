export const bsMonths = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
];
export const weekdays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
export const np = (value: string | number) =>
  String(value).replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)]);
export function nepalDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export const formatDate = (key: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${key}T00:00:00Z`));
export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
export function shiftMonth(year: number, month: number, offset: number) {
  const index = year * 12 + month - 1 + offset;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
