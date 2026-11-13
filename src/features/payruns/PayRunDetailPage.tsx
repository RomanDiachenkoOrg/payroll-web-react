import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeletePayRunMutation, useGetPayRunQuery, usePayRunActionMutation } from '../../api/payrollApi';
import { useGetDepartmentsQuery } from '../../api/adminApi';
import type { Payslip } from '../../api/types';
import { useCan, useCurrentUser, useToast } from '../../app/hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorAlert, Loading, PageHeader, StatCard, StatusBadge } from '../../components/ui';
import { downloadCsv, money2, toCsv } from '../../lib/csv';
import { errorMessage, errorStatus } from '../../lib/errors';
import { formatDate, formatDateTime, formatHours, formatMoney } from '../../lib/format';

type Pending = 'approve' | 'pay' | 'delete' | null;

export function PayRunDetailPage() {
  const id = Number(useParams().id);
  const can = useCan();
  const user = useCurrentUser();
  const toast = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [pending, setPending] = useState<Pending>(null);

  const { data: run, isLoading, error } = useGetPayRunQuery(id);
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [runAction, { isLoading: working }] = usePayRunActionMutation();
  const [deleteRun] = useDeletePayRunMutation();

  const slips = useMemo(() => run?.payslips ?? [], [run]);
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? slips.filter((p) => p.employeeName.toLowerCase().includes(q)) : slips;
  }, [slips, filter]);

  if (isLoading) return <Loading />;
  if (errorStatus(error) === 404) return <div className="alert alert-warning">Pay run not found.</div>;
  if (error || !run) return <ErrorAlert error={error} />;

  const manage = can('payruns:manage');
  const deptName = (deptId: number) => departments.find((d) => d.id === deptId)?.name ?? '';
  const showSlipLinks = user?.role === 'admin' || run.status === 'Approved' || run.status === 'Paid';

  const act = async (action: 'calculate' | 'approve' | 'pay', message: (n: number) => string) => {
    try {
      const updated = await runAction({ id, action }).unwrap();
      toast('success', message(updated.payslips?.length ?? slips.length));
    } catch (err) {
      toast('error', errorMessage(err));
    }
    setPending(null);
  };

  const doDelete = async () => {
    try {
      await deleteRun(id).unwrap();
      toast('success', 'Pay run deleted.');
      navigate('/payruns');
    } catch (err) {
      toast('error', errorMessage(err));
      setPending(null);
    }
  };

  const exportCsv = () => {
    const csv = toCsv<Payslip>(
      [
        { label: 'Employee', value: (p) => p.employeeName },
        { label: 'Department', value: (p) => deptName(p.departmentId) },
        { label: 'Pay type', value: (p) => p.payType },
        { label: 'Regular hours', value: (p) => p.regularHours },
        { label: 'Overtime hours', value: (p) => p.overtimeHours },
        { label: 'Gross', value: (p) => money2(p.gross) },
        { label: 'Income tax', value: (p) => money2(p.tax) },
        { label: 'Social', value: (p) => money2(p.social) },
        { label: 'Pension', value: (p) => money2(p.pension) },
        { label: 'Other deductions', value: (p) => money2(p.other) },
        { label: 'Net', value: (p) => money2(p.net) },
      ],
      slips,
    );
    downloadCsv(`payrun-${run.periodStart.slice(0, 7)}.csv`, csv);
  };

  const editable = run.status === 'Draft' || run.status === 'Calculated';

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/payruns">Pay runs</Link> / {run.name}
      </nav>
      <PageHeader
        title={
          <>
            {run.name} <StatusBadge status={run.status} />
          </>
        }
        actions={
          <>
            {manage && editable && (
              <button type="button" className="btn" disabled={working} onClick={() => act('calculate', (n) => `Calculated ${n} payslips.`)}>
                {run.status === 'Draft' ? 'Calculate' : 'Recalculate'}
              </button>
            )}
            {manage && run.status !== 'Paid' && run.status !== 'Approved' && (
              <button
                type="button"
                className="btn btn-success"
                disabled={working}
                onClick={() => setPending('approve')}
              >
                Approve
              </button>
            )}
            {manage && run.status === 'Approved' && (
              <button type="button" className="btn btn-primary" disabled={working} onClick={() => setPending('pay')}>
                Mark as paid
              </button>
            )}
            {manage && editable && (
              <button type="button" className="btn btn-ghost text-danger" onClick={() => setPending('delete')}>
                Delete
              </button>
            )}
            {slips.length > 0 && (
              <button type="button" className="btn" onClick={exportCsv}>
                Export CSV
              </button>
            )}
          </>
        }
      />

      {run.status === 'Paid' && (
        <div className="alert alert-info" role="status">
          🔒 This pay run was paid on {formatDateTime(run.paidAt)} and is locked.
        </div>
      )}

      <div className="stats">
        <StatCard label="Period" value={`${formatDate(run.periodStart)} – ${formatDate(run.periodEnd)}`} />
        <StatCard label="Pay date" value={formatDate(run.payDate)} />
        <StatCard label="Gross" value={formatMoney(run.totals.gross)} testId="run-total-gross" />
        <StatCard label="Net" value={formatMoney(run.totals.net)} testId="run-total-net" />
      </div>

      <section className="card no-pad">
        <div className="card-header padded">
          <h2>Payslips ({slips.length})</h2>
          <input
            type="search"
            placeholder="Filter by name"
            aria-label="Filter payslips by name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <table className="table compact hover" data-testid="payrun-lines">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th className="num">Hours</th>
              <th className="num">Gross</th>
              <th className="num">Tax</th>
              <th className="num">Social</th>
              <th className="num">Pension</th>
              <th className="num">Other</th>
              <th className="num">Net</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {slips.length === 0 && (
              <tr>
                <td colSpan={10} className="muted">
                  {run.status === 'Draft' ? 'Not calculated yet. Click "Calculate" to generate payslips.' : 'No payslips.'}
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr key={p.id}>
                <td>{p.employeeName}</td>
                <td>{deptName(p.departmentId)}</td>
                <td className="num">
                  {p.payType === 'hourly' ? (
                    <>
                      {formatHours(p.regularHours)}
                      {p.overtimeHours > 0 && ` + ${formatHours(p.overtimeHours)} OT`}
                    </>
                  ) : (
                    <span className="muted">salaried</span>
                  )}
                </td>
                <td className="num">{formatMoney(p.gross)}</td>
                <td className="num">{formatMoney(p.tax)}</td>
                <td className="num">{formatMoney(p.social)}</td>
                <td className="num">{formatMoney(p.pension)}</td>
                <td className="num">{formatMoney(p.other)}</td>
                <td className="num">
                  <strong>{formatMoney(p.net)}</strong>
                </td>
                <td className="actions">{showSlipLinks && <Link to={`/payslips/${p.id}`}>View</Link>}</td>
              </tr>
            ))}
          </tbody>
          {slips.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3}>Total ({run.totals.employees} employees)</td>
                <td className="num">{formatMoney(run.totals.gross)}</td>
                <td className="num">{formatMoney(run.totals.tax)}</td>
                <td className="num">{formatMoney(run.totals.social)}</td>
                <td className="num">{formatMoney(run.totals.pension)}</td>
                <td className="num">{formatMoney(run.totals.other)}</td>
                <td className="num">{formatMoney(run.totals.net)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </section>

      {pending === 'approve' && (
        <ConfirmDialog
          title="Approve pay run"
          message={`Approve ${run.name} with a net total of ${formatMoney(run.totals.net)}? Employees will be able to see their payslips.`}
          confirmLabel="Approve"
          busy={working}
          onConfirm={() => act('approve', () => 'Pay run approved.')}
          onCancel={() => setPending(null)}
        />
      )}
      {pending === 'pay' && (
        <ConfirmDialog
          title="Mark as paid"
          message={`Mark ${run.name} as paid? The pay run will be locked and cannot be changed afterwards.`}
          confirmLabel="Mark as paid"
          danger
          busy={working}
          onConfirm={() => act('pay', () => 'Pay run marked as paid.')}
          onCancel={() => setPending(null)}
        />
      )}
      {pending === 'delete' && (
        <ConfirmDialog
          title="Delete pay run"
          message={`Delete ${run.name} and all of its payslips?`}
          confirmLabel="Delete"
          danger
          onConfirm={doDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
