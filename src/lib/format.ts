const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return currency.format(value);
}

export function formatHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100000) / 1000}%`;
}

/** 'YYYY-MM-DD' -> 'Nov 3, 2026' */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 'YYYY-MM' -> 'November 2026' */
export function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(value);
  return m ? `${FULL_MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}
