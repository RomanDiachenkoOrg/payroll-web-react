import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRejectTimesheetMutation } from '../../api/timesheetsApi';
import type { Timesheet } from '../../api/types';
import { useToast } from '../../app/hooks';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/ui';
import { rejectSchema, type RejectValues } from '../../lib/schemas';
import { errorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';

export function RejectDialog({ timesheet, onClose }: { timesheet: Timesheet; onClose: () => void }) {
  const toast = useToast();
  const [reject] = useRejectTimesheetMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RejectValues>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });

  const onSubmit = async ({ reason }: RejectValues) => {
    try {
      await reject({ id: timesheet.id, reason: reason.trim() }).unwrap();
      toast('success', 'Timesheet rejected.');
      onClose();
    } catch (err) {
      toast('error', errorMessage(err));
    }
  };

  return (
    <Modal title="Reject timesheet" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <p>
          Rejecting the timesheet of <strong>{timesheet.employeeName}</strong> for the week of {formatDate(timesheet.weekStart)}.
        </p>
        <Field label="Reason" htmlFor="reject-reason" error={errors.reason?.message}>
          <textarea id="reject-reason" rows={3} {...register('reason')} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
            Reject timesheet
          </button>
        </div>
      </form>
    </Modal>
  );
}
