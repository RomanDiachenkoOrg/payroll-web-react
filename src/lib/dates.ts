const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return toIsoDate(new Date());
}

export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) {
    return null;
  }
  return d;
}

export function isMonday(value: string): boolean {
  return parseIsoDate(value)?.getDay() === 1;
}

/** Monday of the week containing `d`. */
export function mondayOf(d: Date = new Date()): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return toIsoDate(copy);
}

/** The seven dates (M/D) of a week starting at `weekStart`. */
export function weekDays(weekStart: string): string[] {
  const start = parseIsoDate(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    if (!start) return '';
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
}

/** First/last day of the month after `periodEnd` (or the current month). */
export function nextPeriod(periodEnd: string | undefined, payDay = 28) {
  let year: number;
  let month: number;
  if (periodEnd) {
    const [y, m] = periodEnd.split('-').map(Number);
    year = y;
    month = m; // 0-based index of the following month
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const pay = new Date(year, month, Math.min(payDay, end.getDate()));
  return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end), payDate: toIsoDate(pay) };
}
