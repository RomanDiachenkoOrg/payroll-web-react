import { formatMoney } from '../../lib/format';

interface Row {
  departmentId: number;
  name: string;
  gross: number;
}

/** Simple horizontal bar chart, no chart library needed for five bars. */
export function DepartmentCostChart({ rows }: { rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.gross));
  return (
    <div className="bar-chart" role="img" aria-label="Gross payroll by department">
      {rows.map((r) => (
        <div className="bar-row" key={r.departmentId}>
          <span className="bar-label">{r.name}</span>
          <span className="bar-track">
            <span className="bar" style={{ width: `${Math.round((r.gross / max) * 100)}%` }} />
          </span>
          <span className="bar-value">{formatMoney(r.gross)}</span>
        </div>
      ))}
    </div>
  );
}
