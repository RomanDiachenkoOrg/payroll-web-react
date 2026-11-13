import { Link, useParams } from 'react-router-dom';
import { useGetPayslipQuery } from '../../api/payrollApi';
import { ErrorAlert, Loading, PageHeader } from '../../components/ui';
import { errorStatus } from '../../lib/errors';
import { formatDate, formatHours, formatMoney } from '../../lib/format';
import { round2 } from '../../lib/money';

export function PayslipPage() {
  const id = Number(useParams().id);
  const { data: p, isLoading, error } = useGetPayslipQuery(id);

  if (isLoading) return <Loading />;
  if (errorStatus(error) === 404) return <div className="alert alert-warning">Payslip not found.</div>;
  if (error || !p) return <ErrorAlert error={error} />;

  const regularPay = p.rate ? round2(p.rate * p.regularHours) : 0;
  const overtimePay = round2(p.gross - regularPay);
  const totalDeductions = round2(p.tax + p.social + p.pension + p.other);

  return (
    <>
      <nav className="breadcrumb no-print" aria-label="Breadcrumb">
        <Link to={`/employees/${p.employeeId}`}>{p.employeeName}</Link> / Payslip {p.payRun.name}
      </nav>
      <PageHeader
        title={
          <>
            Payslip <small>{p.payRun.name}</small>
          </>
        }
        actions={
          <>
            <button type="button" className="btn" onClick={() => window.print()}>
              Print
            </button>
            <a className="btn" href={`/api/payslips/${p.id}/export.csv`} download data-testid="payslip-csv">
              Download CSV
            </a>
          </>
        }
      />

      <article className="card payslip" data-testid="payslip">
        <div className="payslip-head">
          <div>
            <h2>Acme Corp</h2>
            <p className="muted">
              Payslip for {formatDate(p.payRun.periodStart)} – {formatDate(p.payRun.periodEnd)}
            </p>
          </div>
          <div className="text-right">
            <strong>{p.employeeName}</strong>
            <div>{p.employee.title}</div>
            <div>{p.employee.departmentName}</div>
            <div className="muted">Employee #{p.employeeId}</div>
            <p>
              Pay date: <strong>{formatDate(p.payRun.payDate)}</strong>
            </p>
          </div>
        </div>

        <table className="table" data-testid="payslip-breakdown">
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Quantity</th>
              <th className="num">Rate</th>
              <th className="num">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            {p.payType === 'hourly' ? (
              <>
                <tr>
                  <td>Regular hours</td>
                  <td className="num">{formatHours(p.regularHours)}</td>
                  <td className="num">{formatMoney(p.rate)}</td>
                  <td className="num">{formatMoney(regularPay)}</td>
                </tr>
                {p.overtimeHours > 0 && (
                  <tr>
                    <td>Overtime (x1.5)</td>
                    <td className="num">{formatHours(p.overtimeHours)}</td>
                    <td className="num">{formatMoney((p.rate ?? 0) * 1.5)}</td>
                    <td className="num">{formatMoney(overtimePay)}</td>
                  </tr>
                )}
              </>
            ) : (
              <tr>
                <td>Monthly salary</td>
                <td className="num">1</td>
                <td className="num" />
                <td className="num">{formatMoney(p.gross)}</td>
              </tr>
            )}
            <tr className="subtotal">
              <td colSpan={3}>Gross pay</td>
              <td className="num">{formatMoney(p.gross)}</td>
            </tr>
            <tr>
              <td colSpan={3}>Income tax</td>
              <td className="num">{formatMoney(-p.tax)}</td>
            </tr>
            <tr>
              <td colSpan={3}>Social contribution</td>
              <td className="num">{formatMoney(-p.social)}</td>
            </tr>
            {p.pension > 0 && (
              <tr>
                <td colSpan={3}>Pension</td>
                <td className="num">{formatMoney(-p.pension)}</td>
              </tr>
            )}
            {p.deductions.map((d) => (
              <tr key={d.typeId}>
                <td colSpan={3}>{d.name}</td>
                <td className="num">{formatMoney(-d.amount)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}>Total deductions</td>
              <td className="num">{formatMoney(-totalDeductions)}</td>
            </tr>
            <tr className="net-row">
              <td colSpan={3}>Net pay</td>
              <td className="num" data-testid="payslip-net">
                {formatMoney(p.net)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="muted small">Pay run status: {p.payRun.status}. Amounts in USD.</p>
      </article>
    </>
  );
}
