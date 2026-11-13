import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetCostReportQuery } from '../../api/payrollApi';
import type { CostReportRow } from '../../api/types';
import { ErrorAlert, Field, Loading, PageHeader } from '../../components/ui';
import { downloadCsv, money2, toCsv } from '../../lib/csv';
import { formatMoney, formatMonth } from '../../lib/format';
import { sum } from '../../lib/money';
import { reportSchema, type ReportValues } from '../../lib/schemas';
import { toIsoDate } from '../../lib/dates';

const AMOUNTS = ['gross', 'tax', 'social', 'pension', 'other', 'net', 'employerCost'] as const;
type Amount = (typeof AMOUNTS)[number];

function defaultPeriod(): ReportValues {
  const now = new Date();
  return {
    from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)).slice(0, 7),
    to: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)).slice(0, 7),
    includeUnpaid: false,
  };
}

export function totalsOf(rows: CostReportRow[]): Record<Amount, number> {
  return Object.fromEntries(AMOUNTS.map((k) => [k, sum(rows.map((r) => r[k]))])) as Record<Amount, number>;
}

export function reportCsv(rows: CostReportRow[]): string {
  const total = { departmentId: 0, departmentName: 'Total', employees: NaN, ...totalsOf(rows) };
  return toCsv<CostReportRow>(
    [
      { label: 'Department', value: (r) => r.departmentName },
      { label: 'Employees', value: (r) => (Number.isNaN(r.employees) ? '' : r.employees) },
      { label: 'Gross', value: (r) => money2(r.gross) },
      { label: 'Income tax', value: (r) => money2(r.tax) },
      { label: 'Social', value: (r) => money2(r.social) },
      { label: 'Pension', value: (r) => money2(r.pension) },
      { label: 'Other deductions', value: (r) => money2(r.other) },
      { label: 'Net', value: (r) => money2(r.net) },
      { label: 'Employer cost', value: (r) => money2(r.employerCost) },
    ],
    [...rows, total],
  );
}

export function ReportsPage() {
  const [criteria, setCriteria] = useState<ReportValues>(defaultPeriod);
  const { data: report, isFetching, error } = useGetCostReportQuery(criteria);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportValues>({ resolver: zodResolver(reportSchema), defaultValues: criteria });

  const total = report ? totalsOf(report.rows) : null;

  return (
    <>
      <PageHeader
        title="Payroll cost by department"
        actions={
          <>
            <button type="button" className="btn" disabled={!report} onClick={() => window.print()}>
              Print
            </button>
            <button
              type="button"
              className="btn"
              disabled={!report?.rows.length}
              onClick={() => report && downloadCsv(`payroll-cost-${report.from}-to-${report.to}.csv`, reportCsv(report.rows))}
            >
              Export CSV
            </button>
          </>
        }
      />

      <form className="filters no-print" onSubmit={handleSubmit(setCriteria)} noValidate>
        <Field label="From month" htmlFor="report-from" error={errors.from?.message}>
          <input id="report-from" type="month" {...register('from')} />
        </Field>
        <Field label="To month" htmlFor="report-to" error={errors.to?.message}>
          <input id="report-to" type="month" {...register('to')} />
        </Field>
        <label className="checkbox">
          <input type="checkbox" {...register('includeUnpaid')} /> Include approved (not yet paid) runs
        </label>
        <button type="submit" className="btn btn-primary">
          Run report
        </button>
      </form>

      <ErrorAlert error={error} />
      {isFetching && !report && <Loading />}
      {report && total && (
        <>
          <p className="muted">
            {formatMonth(report.from)} – {formatMonth(report.to)}.{' '}
            {report.payRuns.length
              ? `Pay runs included: ${report.payRuns.map((r) => r.name).join(', ')}.`
              : 'No pay runs in this period.'}
          </p>
          <div className="card no-pad">
            <table className="table" data-testid="report-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="num">Employees</th>
                  <th className="num">Gross</th>
                  <th className="num">Income tax</th>
                  <th className="num">Social</th>
                  <th className="num">Pension</th>
                  <th className="num">Other</th>
                  <th className="num">Net</th>
                  <th className="num">Employer cost</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.departmentId}>
                    <td>{r.departmentName}</td>
                    <td className="num">{r.employees}</td>
                    {AMOUNTS.map((k) => (
                      <td key={k} className="num">
                        {formatMoney(r[k])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td />
                  {AMOUNTS.map((k) => (
                    <td key={k} className="num">
                      {formatMoney(total[k])}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  );
}
