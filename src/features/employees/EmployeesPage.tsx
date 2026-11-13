import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGetEmployeesQuery, useSetEmployeeActiveMutation } from '../../api/employeesApi';
import { useGetDepartmentsQuery } from '../../api/adminApi';
import type { Employee } from '../../api/types';
import { useCan, useToast } from '../../app/hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { ErrorAlert, Loading, PageHeader, StatusBadge } from '../../components/ui';
import {
  defaultCriteria,
  filterEmployees,
  paginate,
  sortEmployees,
  type EmployeeCriteria,
  type EmployeeSortKey,
  type EmployeeStatusFilter,
} from '../../lib/employeeQuery';
import { errorMessage } from '../../lib/errors';
import { formatDate, formatMoney } from '../../lib/format';

const PER_PAGE = 10;

const COLUMNS: { key: EmployeeSortKey; label: string; className?: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'department', label: 'Department' },
  { key: 'hireDate', label: 'Hire date' },
  { key: 'pay', label: 'Pay', className: 'num' },
];

function readCriteria(params: URLSearchParams): EmployeeCriteria {
  return {
    q: params.get('q') ?? defaultCriteria.q,
    departmentId: params.get('dept') ? Number(params.get('dept')) : null,
    status: (params.get('status') as EmployeeStatusFilter) ?? defaultCriteria.status,
    sortBy: (params.get('sort') as EmployeeSortKey) ?? defaultCriteria.sortBy,
    sortDir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

export function EmployeesPage() {
  const can = useCan();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const criteria = readCriteria(params);
  const page = Number(params.get('page') ?? 1);

  const { data: employees = [], isLoading, error } = useGetEmployeesQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [setActive, { isLoading: saving }] = useSetEmployeeActiveMutation();
  const [toDeactivate, setToDeactivate] = useState<Employee | null>(null);

  const result = useMemo(() => {
    const filtered = filterEmployees(employees, criteria);
    const sorted = sortEmployees(filtered, criteria.sortBy, criteria.sortDir, departments);
    return paginate(sorted, page, PER_PAGE);
  }, [employees, departments, params]);

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const toggleSort = (key: EmployeeSortKey) => {
    const dir = criteria.sortBy === key && criteria.sortDir === 'asc' ? 'desc' : 'asc';
    update({ sort: key, dir }, false);
  };

  const deptName = (id: number) => departments.find((d) => d.id === id)?.name ?? '';

  const deactivate = async () => {
    if (!toDeactivate) return;
    try {
      await setActive({ id: toDeactivate.id, active: false }).unwrap();
      toast('success', `${toDeactivate.firstName} ${toDeactivate.lastName} has been deactivated.`);
    } catch (err) {
      toast('error', errorMessage(err));
    }
    setToDeactivate(null);
  };

  const reactivate = async (e: Employee) => {
    try {
      await setActive({ id: e.id, active: true }).unwrap();
      toast('success', `${e.firstName} ${e.lastName} is active again.`);
    } catch (err) {
      toast('error', errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Employees"
        actions={
          can('employees:edit') && (
            <Link to="/employees/new" className="btn btn-primary">
              New employee
            </Link>
          )
        }
      />

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="sr-only" htmlFor="employee-search">
          Search
        </label>
        <input
          id="employee-search"
          type="search"
          placeholder="Search name, email or title"
          value={criteria.q}
          onChange={(e) => update({ q: e.target.value })}
        />
        <label htmlFor="filter-department">Department</label>
        <select
          id="filter-department"
          value={criteria.departmentId ?? ''}
          onChange={(e) => update({ dept: e.target.value })}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label htmlFor="filter-status">Status</label>
        <select id="filter-status" value={criteria.status} onChange={(e) => update({ status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </form>

      <ErrorAlert error={error} />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="card no-pad">
          <table className="table hover" data-testid="employees-table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={c.className}
                    aria-sort={criteria.sortBy === c.key ? (criteria.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button type="button" className="sort-button" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {criteria.sortBy === c.key && (criteria.sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </button>
                  </th>
                ))}
                <th>Status</th>
                {can('employees:edit') && (
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No employees match your filters.
                  </td>
                </tr>
              )}
              {result.items.map((e) => (
                <tr key={e.id} className={e.active ? undefined : 'inactive'}>
                  <td>
                    <Link to={`/employees/${e.id}`}>
                      {e.lastName}, {e.firstName}
                    </Link>
                    <div className="muted small">{e.email}</div>
                  </td>
                  <td>{e.title}</td>
                  <td>{deptName(e.departmentId)}</td>
                  <td>{formatDate(e.hireDate)}</td>
                  <td className="num">
                    {e.payType === 'hourly' ? `${formatMoney(e.hourlyRate)}/h` : `${formatMoney(e.annualSalary)}/yr`}
                  </td>
                  <td>
                    <StatusBadge status={e.active ? 'Active' : 'Inactive'} />
                  </td>
                  {can('employees:edit') && (
                    <td className="actions">
                      <Link to={`/employees/${e.id}/edit`} className="btn btn-sm">
                        Edit
                      </Link>
                      {e.active ? (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setToDeactivate(e)}>
                          Deactivate
                        </button>
                      ) : (
                        <button type="button" className="btn btn-sm" onClick={() => reactivate(e)} disabled={saving}>
                          Reactivate
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="list-footer">
        <span className="muted" data-testid="list-summary">
          {result.total ? `Showing ${result.from}-${result.to} of ${result.total} employees` : ''}
        </span>
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          onChange={(p) => update({ page: String(p) }, false)}
          label="Employee pages"
        />
      </div>

      {toDeactivate && (
        <ConfirmDialog
          title="Deactivate employee"
          message={`Deactivate ${toDeactivate.firstName} ${toDeactivate.lastName}? They will be excluded from future pay runs.`}
          confirmLabel="Deactivate"
          danger
          busy={saving}
          onConfirm={deactivate}
          onCancel={() => setToDeactivate(null)}
        />
      )}
    </>
  );
}
