export type Role = 'admin' | 'manager' | 'employee';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  departmentId: number | null;
  employeeId: number | null;
  active: boolean;
  lastLoginAt: string | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  costCenter: string;
  managerEmployeeId: number | null;
  employeeCount: number;
  activeEmployeeCount: number;
}

export type PayType = 'salaried' | 'hourly';

export interface EmployeeDeduction {
  typeId: number;
  amount: number;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  departmentId: number;
  payType: PayType;
  annualSalary: number | null;
  hourlyRate: number | null;
  hireDate: string;
  terminationDate?: string | null;
  active: boolean;
  pensionOptIn: boolean;
  deductions: EmployeeDeduction[];
}

export type EmployeeInput = Omit<Employee, 'id' | 'active' | 'terminationDate'>;

export interface SalaryChange {
  id: number;
  employeeId: number;
  effectiveDate: string;
  payType: PayType;
  amount: number;
  reason: string;
}

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface Timesheet {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentId: number | null;
  weekStart: string;
  hours: number[];
  totalHours: number;
  notes: string;
  status: TimesheetStatus;
  rejectReason?: string | null;
  decidedBy?: string;
  decidedAt?: string;
  submittedAt?: string;
}

export interface TimesheetInput {
  employeeId?: number;
  weekStart: string;
  hours: number[];
  notes: string;
}

export type PayRunStatus = 'Draft' | 'Calculated' | 'Approved' | 'Paid';

export interface Totals {
  employees: number;
  gross: number;
  tax: number;
  social: number;
  pension: number;
  other: number;
  net: number;
}

export interface PayslipDeduction {
  typeId: number;
  name: string;
  amount: number;
}

export interface Payslip {
  id: number;
  payRunId: number;
  employeeId: number;
  employeeName: string;
  departmentId: number;
  payType: PayType;
  rate: number | null;
  regularHours: number;
  overtimeHours: number;
  gross: number;
  tax: number;
  social: number;
  pension: number;
  other: number;
  deductions: PayslipDeduction[];
  net: number;
}

export interface EmployeePayslip extends Payslip {
  payRunName: string;
  payDate: string;
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
}

export interface PayslipDetail extends Payslip {
  payRun: { id: number; name: string; periodStart: string; periodEnd: string; payDate: string; status: PayRunStatus };
  employee: { id: number; email: string; title: string; departmentName: string };
}

export interface PayRun {
  id: number;
  name: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: PayRunStatus;
  totals: Totals;
  createdBy: string;
  createdAt: string;
  calculatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  payslips?: Payslip[];
}

export interface PayRunInput {
  name?: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
}

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
}

export interface Settings {
  currency: string;
  socialRate: number;
  pensionRate: number;
  payDay: number;
  taxBrackets: TaxBracket[];
}

export interface DeductionType {
  id: number;
  name: string;
  defaultAmount: number;
}

export interface AuditEntry {
  id: number;
  at: string;
  userId: number | null;
  userEmail: string;
  action: string;
  entity: string;
  entityId: number | null;
  details: string;
}

export interface AuditFilter {
  entity?: string;
  action?: string;
  user?: string;
  from?: string;
  to?: string;
}

export interface DashboardData {
  headcount: number;
  pendingTimesheets: number;
  nextPayDate: string;
  lastPayRun: { id: number; name: string; payDate: string; totals: Totals } | null;
  departments: { departmentId: number; name: string; headcount: number; gross: number }[];
  lastPayslip?: Payslip | null;
  myDraftTimesheets?: number;
  recentActivity?: AuditEntry[];
}

export interface CostReportRow {
  departmentId: number;
  departmentName: string;
  employees: number;
  gross: number;
  tax: number;
  social: number;
  pension: number;
  other: number;
  net: number;
  employerCost: number;
}

export interface CostReport {
  from: string;
  to: string;
  payRuns: { id: number; name: string; status: PayRunStatus }[];
  rows: CostReportRow[];
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
