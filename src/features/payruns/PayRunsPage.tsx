import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPayRunsQuery } from '../../api/payrollApi';
import { useGetSettingsQuery } from '../../api/adminApi';
import { useCan } from '../../app/hooks';
import { ErrorAlert, Loading, PageHeader, StatusBadge } from '../../components/ui';
import { formatDate, formatMoney } from '../../lib/format';
import { NewPayRunDialog } from './NewPayRunDialog';

export function PayRunsPage() {
  const can = useCan();
  const { data: runs = [], isLoading, error } = useGetPayRunsQuery();
  const { data: settings } = useGetSettingsQuery();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Pay runs"
        actions={
          can('payruns:manage') && (
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              New pay run
            </button>
          )
        }
      />
      <ErrorAlert error={error} />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="card no-pad">
          <table className="table hover" data-testid="payruns-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Period</th>
                <th>Pay date</th>
                <th>Status</th>
                <th className="num">Employees</th>
                <th className="num">Gross</th>
                <th className="num">Net</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">No pay runs yet.</td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/payruns/${r.id}`}>{r.name}</Link>
                  </td>
                  <td>
                    {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                  </td>
                  <td>{formatDate(r.payDate)}</td>
                  <td>
                    <StatusBadge status={r.status} /> {r.status === 'Paid' && <span title="Locked" aria-label="Locked">🔒</span>}
                  </td>
                  <td className="num">{r.totals.employees}</td>
                  <td className="num">{r.status === 'Draft' ? '-' : formatMoney(r.totals.gross)}</td>
                  <td className="num">{r.status === 'Draft' ? '-' : formatMoney(r.totals.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && (
        <NewPayRunDialog latestPeriodEnd={runs[0]?.periodEnd} payDay={settings?.payDay} onClose={() => setCreating(false)} />
      )}
    </>
  );
}
