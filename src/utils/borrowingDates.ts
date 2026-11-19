// Keep the date and time in a single, explicit timezone for collection deadlines.
const timeZone = 'Asia/Ho_Chi_Minh';

export function formatCollectionDeadline(value: string): { date: string; time: string } {
  if (!value) return { date: 'Ask at the library counter', time: '' };
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value);
  if (Number.isNaN(date.getTime())) return { date: 'Ask at the library counter', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long', timeZone }).format(date),
    time: value.includes('T') ? new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).format(date) : '',
  };
}

export function formatBorrowingToday(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(date);
}

export function formatShortBorrowingDate(value: string): string {
  if (!value) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone }).format(date);
}
