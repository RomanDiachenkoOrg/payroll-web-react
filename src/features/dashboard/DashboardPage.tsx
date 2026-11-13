import { Link } from 'react-router-dom';
import { useGetDashboardQuery } from '../../api/payrollApi';
import { useCan, useCurrentUser } from '../../app/hooks';
import { ErrorAlert, Loading, PageHeader, StatCard } from '../../components/ui';
import { formatDate, formatDateTime, formatMoney } from '../../lib/format';
import { DepartmentCostChart } from './DepartmentCostChart';

export function DashboardPage() {
  const user = useCurrentUser()!;
  const can = useCan();
  const { data, isLoading, error } = useGetDashboardQuery();
  const isEmployee = user.role === 'employee';

  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorAlert error={error} />;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.name.split(' ')[0]}`} />

      <div className="stats">
        <StatCard
          testId="stat-headcount"
          label={isEmployee ? 'My status' : 'Active headcount'}
          value={isEmployee ? (data.headcount ? 'Active' : 'Inactive') : data.headcount}
        />
        {isEmployee ? (
          <StatCard testId="stat-last-payroll" label="My last net pay" value={data.lastPayslip ? formatMoney(data.lastPayslip.net) : '-'} />
        ) : (
          <StatCard
            testId="stat-last-payroll"
            label="Last payroll (gross)"
            value={data.lastPayRun ? formatMoney(data.lastPayRun.totals.gross) : '-'}
            note={data.lastPayRun?.name}
          />
        )}
        <StatCard
          testId="stat-pending"
          label={isEmployee ? 'Timesheets to submit' : 'Pending timesheets'}
          value={<Link to="/timesheets">{isEmployee ? data.myDraftTimesheets : data.pendingTimesheets}</Link>}
        />
        <StatCard testId="stat-next-pay" label="Next pay date" value={formatDate(data.nextPayDate)} />
      </div>

      <div className="grid-2">
        {!isEmployee && (
          <section className="card">
            <h2>
              Payroll cost by department{data.lastPayRun ? ` – ${data.lastPayRun.name}` : ''}
            </h2>
            <DepartmentCostChart rows={data.departments} />
            <table className="table compact">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="num">Active employees</th>
                  <th className="num">Gross</th>
                </tr>
              </thead>
              <tbody>
                {data.departments.map((d) => (
                  <tr key={d.departmentId}>
                    <td>{d.name}</td>
                    <td className="num">{d.headcount}</td>
                    <td className="num">{formatMoney(d.gross)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div>
          <section className="card">
            <h2>Quick links</h2>
            <ul className="link-list">
              {isEmployee && (
                <>
                  <li><Link to="/me">My profile and payslips</Link></li>
                  <li><Link to="/timesheets/new">Enter this week&apos;s timesheet</Link></li>
                  {data.lastPayslip && <li><Link to={`/payslips/${data.lastPayslip.id}`}>Latest payslip</Link></li>}
                </>
              )}
              {can('timesheets:decide') && <li><Link to="/timesheets">Review submitted timesheets</Link></li>}
              {can('payruns:manage') && <li><Link to="/payruns">Run payroll</Link></li>}
              {can('employees:edit') && <li><Link to="/employees/new">Add an employee</Link></li>}
              {can('reports:view') && <li><Link to="/reports">Payroll cost report</Link></li>}
            </ul>
          </section>

          {data.recentActivity && (
            <section className="card">
              <h2>Recent activity</h2>
              <ul className="activity">
                {data.recentActivity.map((a) => (
                  <li key={a.id}>
                    <span className="muted small">{formatDateTime(a.at)}</span>
                    <div>
                      <strong>{a.userEmail}</strong> {a.action} {a.entity}
                    </div>
                    <div className="muted small">{a.details}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
