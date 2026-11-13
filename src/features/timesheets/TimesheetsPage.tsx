import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useApproveTimesheetMutation,
  useGetTimesheetsQuery,
  useSubmitTimesheetMutation,
} from '../../api/timesheetsApi';
import type { Timesheet, TimesheetStatus } from '../../api/types';
import { useCan, useCurrentUser, useToast } from '../../app/hooks';
import { ErrorAlert, Loading, PageHeader, StatusBadge } from '../../components/ui';
import { canDecideTimesheet, canEditTimesheet } from '../../lib/permissions';
import { errorMessage } from '../../lib/errors';
import { formatDate, formatHours } from '../../lib/format';
import { overtimeHours, TIMESHEET_STATUSES } from '../../lib/timesheet';
import { RejectDialog } from './RejectDialog';

export function TimesheetsPage() {
  const user = useCurrentUser();
  const can = useCan();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  // reviewers land on the queue of submitted timesheets
  const status = (params.get('status') ?? (can('timesheets:decide') ? 'Submitted' : '')) as TimesheetStatus | '';

  const { data: timesheets = [], isFetching, isLoading, error } = useGetTimesheetsQuery(status);
  const [submit] = useSubmitTimesheetMutation();
  const [approve] = useApproveTimesheetMutation();
  const [rejecting, setRejecting] = useState<Timesheet | null>(null);

  const showEmployee = user?.role !== 'employee';
  const canCreate = !!user?.employeeId || can('timesheets:any-employee');

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      toast('success', message);
    } catch (err) {
      toast('error', errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Timesheets"
        actions={
          canCreate && (
            <Link to="/timesheets/new" className="btn btn-primary">
              New timesheet
            </Link>
          )
        }
      />

      <div className="filters">
        <label htmlFor="timesheet-status">Status</label>
        <select
          id="timesheet-status"
          value={status}
          onChange={(e) => setParams({ status: e.target.value }, { replace: true })}
        >
          <option value="">All</option>
          {TIMESHEET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {isFetching && !isLoading && <span className="muted small">Refreshing…</span>}
      </div>

      <ErrorAlert error={error} />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="card no-pad">
          <table className="table" data-testid="timesheets-table">
            <thead>
              <tr>
                {showEmployee && <th>Employee</th>}
                <th>Week of</th>
                <th className="num">Hours</th>
                <th className="num">Overtime</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {timesheets.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No timesheets{status ? ` with status ${status}` : ''}.
                  </td>
                </tr>
              )}
              {timesheets.map((ts) => {
                const ot = overtimeHours(ts.hours);
                return (
                  <tr key={ts.id}>
                    {showEmployee && <td>{ts.employeeName}</td>}
                    <td>
                      <Link to={`/timesheets/${ts.id}`}>{formatDate(ts.weekStart)}</Link>
                    </td>
                    <td className="num">{formatHours(ts.totalHours)}</td>
                    <td className="num">{ot ? formatHours(ot) : ''}</td>
                    <td>
                      <StatusBadge status={ts.status} />
                      {ts.status === 'Rejected' && ts.rejectReason && <div className="small text-danger">{ts.rejectReason}</div>}
                    </td>
                    <td className="actions">
                      {canEditTimesheet(user, ts) && (
                        <>
                          <Link to={`/timesheets/${ts.id}`} className="btn btn-sm">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => run(() => submit(ts.id).unwrap(), `Timesheet for the week of ${formatDate(ts.weekStart)} submitted for approval.`)}
                          >
                            Submit
                          </button>
                        </>
                      )}
                      {canDecideTimesheet(user, ts) && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => run(() => approve(ts.id).unwrap(), `Approved timesheet of ${ts.employeeName}.`)}
                          >
                            Approve
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => setRejecting(ts)}>
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && <RejectDialog timesheet={rejecting} onClose={() => setRejecting(null)} />}
    </>
  );
}
