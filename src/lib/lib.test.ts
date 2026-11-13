import { describe, expect, it } from 'vitest';
import type { Employee } from '../api/types';
import { defaultCriteria, filterEmployees, paginate, sortEmployees } from './employeeQuery';
import { formatDate, formatMoney, formatMonth } from './format';
import { isMonday, mondayOf, nextPeriod, parseIsoDate } from './dates';
import { csvCell, toCsv } from './csv';
import { round2 } from './money';
import { overtimeHours, totalHours } from './timesheet';
import { can, canDecideTimesheet } from './permissions';

const emp = (over: Partial<Employee>): Employee => ({
  id: 1,
  firstName: 'Ann',
  lastName: 'Lee',
  email: 'ann@acme.test',
  phone: '',
  title: 'Engineer',
  departmentId: 1,
  payType: 'salaried',
  annualSalary: 60000,
  hourlyRate: null,
  hireDate: '2020-01-01',
  active: true,
  pensionOptIn: false,
  deductions: [],
  ...over,
});

describe('employeeQuery', () => {
  const list = [
    emp({ id: 1, lastName: 'Young', departmentId: 1 }),
    emp({ id: 2, lastName: 'Adams', departmentId: 2 }),
    emp({ id: 3, lastName: 'Miller', departmentId: 1, active: false }),
  ];

  it('shows only active employees by default', () => {
    expect(filterEmployees(list, defaultCriteria).map((e) => e.id)).toEqual([1, 2]);
  });

  it('filters by department and status', () => {
    expect(filterEmployees(list, { ...defaultCriteria, departmentId: 1, status: 'all' }).map((e) => e.id)).toEqual([1, 3]);
    expect(filterEmployees(list, { ...defaultCriteria, status: 'inactive' }).map((e) => e.id)).toEqual([3]);
  });

  it('sorts by name in both directions', () => {
    expect(sortEmployees(list, 'name', 'asc').map((e) => e.lastName)).toEqual(['Adams', 'Miller', 'Young']);
    expect(sortEmployees(list, 'name', 'desc').map((e) => e.lastName)).toEqual(['Young', 'Miller', 'Adams']);
  });

  it('paginates with a partial last page', () => {
    const items = Array.from({ length: 23 }, (_, i) => i + 1);
    const page = paginate(items, 3, 10);
    expect(page.pageCount).toBe(3);
    expect(page.items).toEqual([21, 22, 23]);
    expect([page.from, page.to, page.total]).toEqual([21, 23, 23]);
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toMatchObject({ pageCount: 1, from: 0, to: 0 });
  });
});

describe('format', () => {
  it('formats money and dates', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(-12)).toBe('-$12.00');
    expect(formatDate('2026-11-03')).toBe('Nov 3, 2026');
    expect(formatMonth('2026-09')).toBe('September 2026');
  });
});

describe('dates', () => {
  it('parses and validates ISO dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-02-28')).not.toBeNull();
    expect(isMonday('2026-11-09')).toBe(true);
    expect(isMonday('2026-11-10')).toBe(false);
  });

  it('finds the Monday of a week', () => {
    expect(mondayOf(new Date(2026, 10, 12))).toBe('2026-11-09');
    expect(mondayOf(new Date(2026, 10, 15))).toBe('2026-11-09');
  });

  it('proposes the next monthly period', () => {
    expect(nextPeriod('2026-11-30', 28)).toEqual({ periodStart: '2026-12-01', periodEnd: '2026-12-31', payDate: '2026-12-28' });
    expect(nextPeriod('2027-01-31', 30).payDate).toBe('2027-02-28');
  });
});

describe('csv', () => {
  it('quotes cells that need it', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(toCsv([{ label: 'N', value: (r: { n: number }) => r.n }], [{ n: 1 }])).toBe('N\r\n1\r\n');
  });
});

describe('money and timesheets', () => {
  it('rounds half up', () => {
    expect(round2(2.675)).toBe(2.68);
    expect(round2(1.005)).toBe(1.01);
  });

  it('counts overtime above 40 hours', () => {
    expect(totalHours(['8', '8', '8', '8', '8', '0', '0'])).toBe(40);
    expect(overtimeHours([8, 8, 8, 8, 8, 0, 0])).toBe(0);
    expect(overtimeHours([10, 10, 10, 10, 5, 0, 0])).toBe(5);
  });
});

describe('permissions', () => {
  const manager = { id: 2, email: 'm', name: 'M', role: 'manager' as const, departmentId: 1, employeeId: 1, active: true, lastLoginAt: null };

  it('checks role permissions', () => {
    expect(can(manager, 'reports:view')).toBe(true);
    expect(can(manager, 'settings:view')).toBe(false);
    expect(can(null, 'reports:view')).toBe(false);
  });

  it('lets managers decide only on submitted timesheets of their department', () => {
    expect(canDecideTimesheet(manager, { employeeId: 5, departmentId: 1, status: 'Submitted' })).toBe(true);
    expect(canDecideTimesheet(manager, { employeeId: 5, departmentId: 2, status: 'Submitted' })).toBe(false);
    expect(canDecideTimesheet(manager, { employeeId: 1, departmentId: 1, status: 'Submitted' })).toBe(false);
    expect(canDecideTimesheet(manager, { employeeId: 5, departmentId: 1, status: 'Draft' })).toBe(false);
  });
});
