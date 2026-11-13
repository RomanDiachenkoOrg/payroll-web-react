import type { Role, User } from '../api/types';

const PERMISSIONS = {
  'employees:list': ['admin', 'manager'],
  'employees:edit': ['admin'],
  'salary:edit': ['admin'],
  'timesheets:decide': ['admin', 'manager'],
  'timesheets:any-employee': ['admin'],
  'payruns:view': ['admin', 'manager'],
  'payruns:manage': ['admin'],
  'departments:view': ['admin'],
  'departments:edit': ['admin'],
  'reports:view': ['admin', 'manager'],
  'settings:view': ['admin'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return (PERMISSIONS[permission] as Role[]).includes(user.role);
}

/** Managers may decide on timesheets of their own department, but not their own. */
export function canDecideTimesheet(
  user: User | null | undefined,
  ts: { employeeId: number; departmentId: number | null; status: string },
): boolean {
  if (!user || ts.status !== 'Submitted') return false;
  if (user.role === 'admin') return true;
  return user.role === 'manager' && ts.departmentId === user.departmentId && ts.employeeId !== user.employeeId;
}

export function canEditTimesheet(user: User | null | undefined, ts: { employeeId: number; status: string }): boolean {
  if (!user) return false;
  const editable = ts.status === 'Draft' || ts.status === 'Rejected';
  return editable && (user.role === 'admin' || ts.employeeId === user.employeeId);
}

export const ROLE_NAMES: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  employee: 'Employee',
};
