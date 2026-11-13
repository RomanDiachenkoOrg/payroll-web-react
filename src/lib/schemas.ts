import { z } from 'zod';
import { isMonday, parseIsoDate, today } from './dates';

const required = (label = 'This field') => z.string().trim().min(1, `${label} is required.`);

const positiveNumber = (message: string) =>
  z.string().trim().refine((v) => v !== '' && Number.isFinite(Number(v)) && Number(v) > 0, message);

const isoDate = (label: string) =>
  required(label).refine((v) => parseIsoDate(v) !== null, 'Enter a valid date (YYYY-MM-DD).');

// ---- login ----

export const loginSchema = z.object({
  email: required('Email').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

// ---- employee ----

export const employeeSchema = z
  .object({
    firstName: required('First name').max(60),
    lastName: required('Last name').max(60),
    email: required('Email').email('Enter a valid email address.'),
    phone: z.string().trim().max(30),
    title: z.string().trim().max(80),
    departmentId: z.string().min(1, 'Select a department.'),
    payType: z.enum(['salaried', 'hourly']),
    annualSalary: z.string(),
    hourlyRate: z.string(),
    hireDate: isoDate('Hire date').refine((v) => v <= today(), 'Hire date cannot be in the future.'),
    pensionOptIn: z.boolean(),
    deductions: z.array(
      z.object({
        typeId: z.string().min(1, 'Select a type.'),
        amount: positiveNumber('Amount must be greater than 0.'),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    const field = v.payType === 'hourly' ? 'hourlyRate' : 'annualSalary';
    const n = Number(v[field]);
    if (v[field].trim() === '' || !Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: v.payType === 'hourly' ? 'Hourly rate must be greater than 0.' : 'Salary must be greater than 0.',
      });
    }
  });
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

// ---- salary change ----

export const raiseSchema = z.object({
  effectiveDate: isoDate('Effective date'),
  amount: positiveNumber('Amount must be greater than 0.'),
  reason: required('Reason').max(200),
});
export type RaiseValues = z.infer<typeof raiseSchema>;

// ---- timesheet ----

const hours = z
  .string()
  .trim()
  .refine((v) => v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 24, 'Hours must be between 0 and 24.');

export const timesheetSchema = z.object({
  employeeId: z.string().optional(),
  weekStart: isoDate('Week start').refine(isMonday, 'The week must start on a Monday.'),
  hours: z.array(hours).length(7),
  notes: z.string().max(500),
});
export type TimesheetValues = z.infer<typeof timesheetSchema>;

export const rejectSchema = z.object({
  reason: required('A reason').max(500),
});
export type RejectValues = z.infer<typeof rejectSchema>;

// ---- pay run ----

export const payRunSchema = z
  .object({
    name: z.string().trim().max(60),
    periodStart: isoDate('Period start'),
    periodEnd: isoDate('Period end'),
    payDate: isoDate('Pay date'),
  })
  .refine((v) => v.periodEnd >= v.periodStart, { path: ['periodEnd'], message: 'Period end must be after period start.' });
export type PayRunValues = z.infer<typeof payRunSchema>;

// ---- department ----

export const departmentSchema = z.object({
  name: required('Name').max(60),
  code: required('Code').regex(/^[A-Za-z0-9]{2,6}$/, 'Use 2-6 letters or digits.'),
  costCenter: z.string().trim().max(20),
  managerEmployeeId: z.string(),
});
export type DepartmentValues = z.infer<typeof departmentSchema>;

// ---- settings ----

const percent = z
  .string()
  .trim()
  .refine((v) => v !== '' && Number(v) >= 0 && Number(v) <= 100, 'Enter a percentage between 0 and 100.');

export const settingsSchema = z
  .object({
    brackets: z
      .array(z.object({ from: z.string(), to: z.string(), rate: percent }))
      .min(1, 'At least one tax bracket is required.'),
    socialRate: percent,
    pensionRate: percent,
    payDay: z.string().refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 28, 'Pay day must be between 1 and 28.'),
  })
  .superRefine((v, ctx) => {
    v.brackets.forEach((b, i) => {
      const isLast = i === v.brackets.length - 1;
      if (!isLast && !(Number(b.to) > Number(b.from))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['brackets', i, 'to'], message: 'Must be greater than "from".' });
      }
    });
  });
export type SettingsValues = z.infer<typeof settingsSchema>;

// ---- report ----

export const reportSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM.'),
    to: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM.'),
    includeUnpaid: z.boolean(),
  })
  .refine((v) => v.to >= v.from, { path: ['to'], message: 'Must not be before the start month.' });
export type ReportValues = z.infer<typeof reportSchema>;
