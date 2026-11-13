import { describe, expect, it } from 'vitest';
import { departmentSchema, employeeSchema, payRunSchema, timesheetSchema } from './schemas';

const validEmployee = {
  firstName: 'Ann',
  lastName: 'Lee',
  email: 'ann@acme.test',
  phone: '',
  title: '',
  departmentId: '1',
  payType: 'salaried' as const,
  annualSalary: '60000',
  hourlyRate: '',
  hireDate: '2024-03-01',
  pensionOptIn: true,
  deductions: [],
};

function issues(result: { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } }) {
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));
}

describe('employeeSchema', () => {
  it('accepts a valid employee', () => {
    expect(employeeSchema.safeParse(validEmployee).success).toBe(true);
  });

  it('requires names, a valid email and a department', () => {
    const r = employeeSchema.safeParse({ ...validEmployee, firstName: ' ', email: 'nope', departmentId: '' });
    expect(issues(r)).toMatchObject({
      firstName: 'First name is required.',
      email: 'Enter a valid email address.',
      departmentId: 'Select a department.',
    });
  });

  it('requires a positive salary or rate depending on pay type', () => {
    expect(issues(employeeSchema.safeParse({ ...validEmployee, annualSalary: '0' }))).toHaveProperty('annualSalary');
    expect(issues(employeeSchema.safeParse({ ...validEmployee, payType: 'hourly', hourlyRate: '' }))).toHaveProperty('hourlyRate');
    expect(employeeSchema.safeParse({ ...validEmployee, payType: 'hourly', annualSalary: '', hourlyRate: '25' }).success).toBe(true);
  });

  it('rejects hire dates next year', () => {
    const year = new Date().getFullYear() + 1;
    expect(issues(employeeSchema.safeParse({ ...validEmployee, hireDate: `${year}-06-01` }))).toHaveProperty('hireDate');
  });
});

describe('timesheetSchema', () => {
  const week = { weekStart: '2026-11-09', hours: ['8', '8', '8', '8', '8', '0', '0'], notes: '' };

  it('accepts a normal week', () => {
    expect(timesheetSchema.safeParse(week).success).toBe(true);
  });

  it('requires a Monday and 0-24 hours per day', () => {
    expect(issues(timesheetSchema.safeParse({ ...week, weekStart: '2026-11-10' }))).toHaveProperty('weekStart');
    expect(issues(timesheetSchema.safeParse({ ...week, hours: ['8', '25', '8', '8', '8', '0', '0'] }))).toHaveProperty('hours.1');
    expect(issues(timesheetSchema.safeParse({ ...week, hours: ['8', '-1', '8', '8', '8', '0', '0'] }))).toHaveProperty('hours.1');
  });
});

describe('payRunSchema and departmentSchema', () => {
  it('rejects a period that ends before it starts', () => {
    const r = payRunSchema.safeParse({ name: '', periodStart: '2026-12-01', periodEnd: '2026-11-30', payDate: '2026-12-28' });
    expect(issues(r)).toHaveProperty('periodEnd');
  });

  it('validates the department code', () => {
    expect(departmentSchema.safeParse({ name: 'Legal', code: 'LEG', costCenter: '', managerEmployeeId: '' }).success).toBe(true);
    expect(issues(departmentSchema.safeParse({ name: 'Legal', code: 'L', costCenter: '', managerEmployeeId: '' }))).toHaveProperty('code');
  });
});
