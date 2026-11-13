import type { Department, Employee } from '../api/types';

export type EmployeeStatusFilter = 'active' | 'inactive' | 'all';
export type EmployeeSortKey = 'name' | 'title' | 'department' | 'hireDate' | 'pay';
export type SortDir = 'asc' | 'desc';

export interface EmployeeCriteria {
  q: string;
  departmentId: number | null;
  status: EmployeeStatusFilter;
  sortBy: EmployeeSortKey;
  sortDir: SortDir;
}

export const defaultCriteria: EmployeeCriteria = {
  q: '',
  departmentId: null,
  status: 'active',
  sortBy: 'name',
  sortDir: 'asc',
};

export function payLabel(e: Employee): string {
  return e.payType === 'hourly' ? `${e.hourlyRate ?? 0}/h` : `${e.annualSalary ?? 0}/yr`;
}

function matchesSearch(e: Employee, q: string): boolean {
  const haystack = `${e.firstName} ${e.lastName} ${e.email} ${e.title}`.toLowerCase();
  return haystack.includes(q);
}

export function filterEmployees(list: Employee[], criteria: EmployeeCriteria): Employee[] {
  const q = criteria.q.trim().toLowerCase();
  return list.filter((e) => {
    if (criteria.departmentId && e.departmentId !== criteria.departmentId) return false;
    if (q) return matchesSearch(e, q);
    if (criteria.status === 'active') return e.active;
    if (criteria.status === 'inactive') return !e.active;
    return true;
  });
}

export function sortEmployees(
  list: Employee[],
  sortBy: EmployeeSortKey,
  sortDir: SortDir,
  departments: Department[] = [],
): Employee[] {
  const deptName = (id: number) => departments.find((d) => d.id === id)?.name ?? '';
  const key: Record<EmployeeSortKey, (e: Employee) => string> = {
    name: (e) => `${e.lastName} ${e.firstName}`,
    title: (e) => e.title ?? '',
    department: (e) => deptName(e.departmentId),
    hireDate: (e) => e.hireDate,
    pay: (e) => payLabel(e),
  };
  const get = key[sortBy];
  const sorted = [...list].sort((a, b) => get(a).localeCompare(get(b), 'en', { sensitivity: 'base' }));
  return sortDir === 'desc' ? sorted.reverse() : sorted;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
}

export function paginate<T>(list: T[], page: number, perPage: number): Page<T> {
  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * perPage;
  const items = list.slice(start, start + perPage);
  return {
    items,
    page: current,
    pageCount,
    total,
    from: total ? start + 1 : 0,
    to: start + items.length,
  };
}
