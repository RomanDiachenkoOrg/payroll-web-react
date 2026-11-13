import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useGetEmployeePayslipsQuery,
  useGetEmployeeQuery,
  useGetSalaryHistoryQuery,
  useSetEmployeeActiveMutation,
} from '../../api/employeesApi';
import { useGetDeductionTypesQuery, useGetDepartmentsQuery } from '../../api/adminApi';
import { useCan, useCurrentUser, useToast } from '../../app/hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorAlert, Loading, PageHeader, StatusBadge } from '../../components/ui';
import { errorMessage, errorStatus } from '../../lib/errors';
import { formatDate, formatMoney } from '../../lib/format';
import { RaiseDialog } from './RaiseDialog';

export function EmployeeDetailPage() {
  const id = Number(useParams().id);
  const user = useCurrentUser();
  const can = useCan();
  const toast = useToast();
  const [showRaise, setShowRaise] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const { data: e, isLoading, error } = useGetEmployeeQuery(id);
  const { data: history = [] } = useGetSalaryHistoryQuery(id, { skip: !e });
  const { data: payslips = [] } = useGetEmployeePayslipsQuery(id, { skip: !e });
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: types = [] } = useGetDeductionTypesQuery();
  const [setActive, { isLoading: saving }] = useSetEmployeeActiveMutation();

  if (isLoading) return <Loading />;
  if (errorStatus(error) === 404) return <div className="alert alert-warning">Employee not found.</div>;
  if (error || !e) return <ErrorAlert error={error} />;

  const fullName = `${e.firstName} ${e.lastName}`;
  const isSelf = user?.employeeId === e.id;
  const canEdit = can('employees:edit');

  const changeActive = async (active: boolean) => {
    try {
      await setActive({ id: e.id, active }).unwrap();
      toast('success', active ? `${fullName} is active again.` : `${fullName} has been deactivated.`);
    } catch (err) {
      toast('error', errorMessage(err));
    }
    setConfirmDeactivate(false);
  };

  return (
    <>
      {can('employees:list') && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/employees">Employees</Link> / {fullName}
        </nav>
      )}
      <PageHeader
        title={
          <>
            {fullName} {!e.active && <StatusBadge status="Inactive" />}
          </>
        }
        subtitle={e.title}
        actions={
          canEdit && (
            <>
              <Link to={`/employees/${e.id}/edit`} className="btn">
                Edit
              </Link>
              {e.active ? (
                <button type="button" className="btn btn-danger" onClick={() => setConfirmDeactivate(true)}>
                  Deactivate
                </button>
              ) : (
                <button type="button" className="btn" onClick={() => changeActive(true)} disabled={saving}>
                  Reactivate
                </button>
              )}
            </>
          )
        }
      />

      <div className="grid-2 wide-right">
        <section className="card">
          <h2>Profile</h2>
          <dl className="details" data-testid="employee-profile">
            <dt>Email</dt>
            <dd><a href={`mailto:${e.email}`}>{e.email}</a></dd>
            <dt>Phone</dt>
            <dd>{e.phone || '-'}</dd>
            <dt>Department</dt>
            <dd>{departments.find((d) => d.id === e.departmentId)?.name}</dd>
            <dt>Hire date</dt>
            <dd>{formatDate(e.hireDate)}</dd>
            {e.terminationDate && (
              <>
                <dt>Left on</dt>
                <dd>{formatDate(e.terminationDate)}</dd>
              </>
            )}
            <dt>Pay</dt>
            <dd>
              {e.payType === 'hourly' ? `${formatMoney(e.hourlyRate)} per hour` : `${formatMoney(e.annualSalary)} per year`}
            </dd>
            <dt>Pension plan</dt>
            <dd>{e.pensionOptIn ? 'Enrolled' : 'Not enrolled'}</dd>
            <dt>Deductions</dt>
            <dd>
              {e.deductions.length === 0 && 'None'}
              {e.deductions.map((d) => (
                <div key={d.typeId}>
                  {types.find((t) => t.id === d.typeId)?.name}: {formatMoney(d.amount)}/month
                </div>
              ))}
            </dd>
          </dl>
        </section>

        <div>
          <section className="card">
            <div className="card-header">
              <h2>Salary history</h2>
              {can('salary:edit') && e.active && (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowRaise(true)}>
                  Add raise
                </button>
              )}
            </div>
            <table className="table compact" data-testid="salary-history">
              <thead>
                <tr>
                  <th>Effective</th>
                  <th className="num">Amount</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{formatDate(h.effectiveDate)}</td>
                    <td className="num">
                      {formatMoney(h.amount)}
                      {h.payType === 'hourly' ? '/h' : '/yr'}
                    </td>
                    <td>{h.reason}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">No salary history.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2>{isSelf ? 'My payslips' : 'Payslips'}</h2>
            <table className="table compact hover" data-testid="employee-payslips">
              <thead>
                <tr>
                  <th>Pay run</th>
                  <th>Pay date</th>
                  <th className="num">Gross</th>
                  <th className="num">Net</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.payRunName} {p.status !== 'Paid' && <StatusBadge status={p.status} />}
                    </td>
                    <td>{formatDate(p.payDate)}</td>
                    <td className="num">{formatMoney(p.gross)}</td>
                    <td className="num">{formatMoney(p.net)}</td>
                    <td className="actions">
                      <Link to={`/payslips/${p.id}`}>View</Link>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">No payslips yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>

      {showRaise && <RaiseDialog employee={e} onClose={() => setShowRaise(false)} />}
      {confirmDeactivate && (
        <ConfirmDialog
          title="Deactivate employee"
          message={`Deactivate ${fullName}? They will be excluded from future pay runs.`}
          confirmLabel="Deactivate"
          danger
          busy={saving}
          onConfirm={() => changeActive(false)}
          onCancel={() => setConfirmDeactivate(false)}
        />
      )}
    </>
  );
}
