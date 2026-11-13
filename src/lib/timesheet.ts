export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const REGULAR_WEEKLY_HOURS = 40;
export const TIMESHEET_STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'] as const;

export function totalHours(hours: Array<number | string>): number {
  return hours.reduce<number>((sum, h) => sum + (Number(h) || 0), 0);
}

/** Hours above 40 in a week are paid as overtime. */
export function overtimeHours(hours: Array<number | string>): number {
  const total = totalHours(hours);
  return total > REGULAR_WEEKLY_HOURS ? total - REGULAR_WEEKLY_HOURS : 0;
}
