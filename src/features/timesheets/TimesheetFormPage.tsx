import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useApproveTimesheetMutation,
  useCreateTimesheetMutation,
  useDeleteTimesheetMutation,
  useGetTimesheetQuery,
  useSubmitTimesheetMutation,
  useUpdateTimesheetMutation,
} from '../../api/timesheetsApi';
import { useGetEmployeesQuery } from '../../api/employeesApi';
import type { Timesheet } from '../../api/types';
import { useCan, useCurrentUser, useToast } from '../../app/hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ErrorAlert, Field, Loading, PageHeader, StatusBadge } from '../../components/ui';
import { timesheetSchema, type TimesheetValues } from '../../lib/schemas';
import { applyServerErrors, errorMessage, errorStatus } from '../../lib/errors';
import { formatDate, formatHours } from '../../lib/format';
import { mondayOf, weekDays } from '../../lib/dates';
import { canDecideTimesheet, canEditTimesheet } from '../../lib/permissions';
import { DAYS, overtimeHours, totalHours } from '../../lib/timesheet';
import { RejectDialog } from './RejectDialog';

const blank = (): TimesheetValues => ({
  employeeId: '',
  weekStart: mondayOf(),
  hours: ['0', '0', '0', '0', '0', '0', '0'],
  notes: '',
});

const toValues = (ts: Timesheet): TimesheetValues => ({
  employeeId: String(ts.employeeId),
  weekStart: ts.weekStart,
  hours: ts.hours.map(String),
  notes: ts.notes ?? '',
});

export function TimesheetFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : null;
  const user = useCurrentUser();
  const can = useCan();
  const toast = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const chooseEmployee = !id && can('timesheets:any-employee');
  const { data: ts, isLoading, error } = useGetTimesheetQuery(id ?? 0, { skip: !id });
  const { data: employees = [] } = useGetEmployeesQuery(undefined, { skip: !chooseEmployee });
  const [create] = useCreateTimesheetMutation();
  const [update] = useUpdateTimesheetMutation();
  const [submit] = useSubmitTimesheetMutation();
  const [approve] = useApproveTimesheetMutation();
  const [remove] = useDeleteTimesheetMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TimesheetValues>({ resolver: zodResolver(timesheetSchema), defaultValues: blank() });

  useEffect(() => {
    if (ts) reset(toValues(ts));
  }, [ts, reset]);

  const hours = watch('hours');
  const weekStart = watch('weekStart');

  if (id && isLoading) return <Loading />;
  if (id && errorStatus(error) === 404) return <div className="alert alert-warning">Timesheet not found.</div>;
  if (id && (error || !ts)) return <ErrorAlert error={error} />;

  const editable = !ts || canEditTimesheet(user, ts);
  const canDecide = !!ts && canDecideTimesheet(user, ts);

  const save = async (values: TimesheetValues, thenSubmit: boolean) => {
    setFormError(null);
    if (chooseEmployee && !values.employeeId) {
      setError('employeeId', { message: 'Select an employee.' });
      return;
    }
    const input = {
      weekStart: values.weekStart,
      hours: values.hours.map(Number),
      notes: values.notes,
      ...(chooseEmployee ? { employeeId: Number(values.employeeId) } : {}),
    };
    try {
      const saved = id ? await update({ id, ...input }).unwrap() : await create(input).unwrap();
      if (thenSubmit) {
        await submit(saved.id).unwrap();
        toast('success', 'Timesheet submitted for approval.');
        navigate('/timesheets');
      } else {
        toast('success', 'Timesheet saved as draft.');
        if (!id) navigate(`/timesheets/${saved.id}`, { replace: true });
      }
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  const doApprove = async () => {
    try {
      await approve(ts!.id).unwrap();
      toast('success', `Approved timesheet of ${ts!.employeeName}.`);
    } catch (err) {
      toast('error', errorMessage(err));
    }
  };

  const doDelete = async () => {
    try {
      await remove(ts!.id).unwrap();
      toast('success', 'Timesheet deleted.');
      navigate('/timesheets');
    } catch (err) {
      toast('error', errorMessage(err));
      setConfirmDelete(false);
    }
  };

  const days = weekDays(weekStart);
  const ot = overtimeHours(hours);

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/timesheets">Timesheets</Link> / {ts ? formatDate(ts.weekStart) : 'New'}
      </nav>
      <PageHeader
        title={
          ts ? (
            <>
              Timesheet <small>week of {formatDate(ts.weekStart)}</small> <StatusBadge status={ts.status} />
            </>
          ) : (
            'New timesheet'
          )
        }
      />

      {ts?.status === 'Rejected' && ts.rejectReason && (
        <div className="alert alert-warning" role="alert">
          <strong>Rejected by {ts.decidedBy}:</strong> {ts.rejectReason}
        </div>
      )}

      <form className="card form" onSubmit={handleSubmit((v) => save(v, false))} noValidate data-testid="timesheet-form">
        <ErrorAlert error={formError} />
        <div className="form-row">
          {chooseEmployee ? (
            <Field label="Employee" htmlFor="ts-employee" error={errors.employeeId?.message}>
              <select id="ts-employee" {...register('employeeId')}>
                <option value="">-- Select --</option>
                {employees
                  .filter((e) => e.active)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.lastName}, {e.firstName}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            ts && (
              <div className="field">
                <span className="label">Employee</span>
                <p>{ts.employeeName}</p>
              </div>
            )
          )}
          <Field label="Week starting (Monday)" htmlFor="ts-week-start" error={errors.weekStart?.message}>
            <input id="ts-week-start" type="date" disabled={!editable} {...register('weekStart')} />
          </Field>
        </div>

        <table className="table timesheet-grid">
          <thead>
            <tr>
              {DAYS.map((d, i) => (
                <th key={d} className="num">
                  <label htmlFor={`ts-hours-${i}`}>{d}</label>
                  <div className="muted small">{days[i]}</div>
                </th>
              ))}
              <th className="num">Total</th>
              <th className="num">Overtime</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {DAYS.map((d, i) => (
                <td key={d} className={errors.hours?.[i] ? 'num has-error' : 'num'}>
                  <input
                    id={`ts-hours-${i}`}
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    disabled={!editable}
                    aria-invalid={!!errors.hours?.[i]}
                    {...register(`hours.${i}` as const)}
                  />
                  {errors.hours?.[i] && <small className="field-error">0-24</small>}
                </td>
              ))}
              <td className="num">
                <strong data-testid="ts-total">{formatHours(totalHours(hours))}</strong>
              </td>
              <td className="num" data-testid="ts-overtime">
                {ot ? formatHours(ot) : '-'}
              </td>
            </tr>
          </tbody>
        </table>

        <Field label="Notes" htmlFor="ts-notes" error={errors.notes?.message}>
          <textarea id="ts-notes" rows={2} disabled={!editable} {...register('notes')} />
        </Field>

        <div className="form-actions">
          {editable && (
            <>
              <button type="submit" className="btn" disabled={isSubmitting}>
                Save draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSubmitting}
                onClick={handleSubmit((v) => save(v, true))}
              >
                Save &amp; submit
              </button>
              {ts?.status === 'Draft' && (
                <button type="button" className="btn btn-ghost text-danger" onClick={() => setConfirmDelete(true)}>
                  Delete
                </button>
              )}
            </>
          )}
          {canDecide && (
            <>
              <button type="button" className="btn btn-success" onClick={doApprove}>
                Approve
              </button>
              <button type="button" className="btn btn-danger" onClick={() => setRejecting(true)}>
                Reject
              </button>
            </>
          )}
          <Link to="/timesheets" className="btn btn-ghost">
            Back to list
          </Link>
        </div>
      </form>

      {confirmDelete && ts && (
        <ConfirmDialog
          title="Delete timesheet"
          message={`Delete this draft timesheet for the week of ${formatDate(ts.weekStart)}?`}
          confirmLabel="Delete"
          danger
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {rejecting && ts && <RejectDialog timesheet={ts} onClose={() => setRejecting(false)} />}
    </>
  );
}
