import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAddSalaryChangeMutation } from '../../api/employeesApi';
import type { Employee } from '../../api/types';
import { useToast } from '../../app/hooks';
import { Modal } from '../../components/Modal';
import { ErrorAlert, Field } from '../../components/ui';
import { raiseSchema, type RaiseValues } from '../../lib/schemas';
import { applyServerErrors } from '../../lib/errors';
import { formatMoney } from '../../lib/format';
import { today } from '../../lib/dates';

export function RaiseDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const toast = useToast();
  const [addChange] = useAddSalaryChangeMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const hourly = employee.payType === 'hourly';
  const current = hourly ? employee.hourlyRate : employee.annualSalary;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RaiseValues>({
    resolver: zodResolver(raiseSchema),
    defaultValues: { effectiveDate: today(), amount: '', reason: '' },
  });

  const onSubmit = async (v: RaiseValues) => {
    try {
      await addChange({ employeeId: employee.id, effectiveDate: v.effectiveDate, amount: Number(v.amount), reason: v.reason.trim() }).unwrap();
      toast('success', 'Salary change saved.');
      onClose();
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  return (
    <Modal title={`Salary change for ${employee.firstName} ${employee.lastName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ErrorAlert error={formError} />
        <p className="muted">
          Current: {formatMoney(current)} {hourly ? 'per hour' : 'per year'}
        </p>
        <Field label={hourly ? 'New hourly rate (USD)' : 'New annual salary (USD)'} htmlFor="raise-amount" error={errors.amount?.message}>
          <input id="raise-amount" type="number" step="0.01" {...register('amount')} />
        </Field>
        <Field label="Effective date" htmlFor="raise-date" error={errors.effectiveDate?.message}>
          <input id="raise-date" type="date" {...register('effectiveDate')} />
        </Field>
        <Field label="Reason" htmlFor="raise-reason" error={errors.reason?.message}>
          <input id="raise-reason" placeholder="e.g. Annual review" {...register('reason')} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            Save raise
          </button>
        </div>
      </form>
    </Modal>
  );
}
