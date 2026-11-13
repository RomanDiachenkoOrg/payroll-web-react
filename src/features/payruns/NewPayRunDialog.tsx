import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useCreatePayRunMutation } from '../../api/payrollApi';
import { useToast } from '../../app/hooks';
import { Modal } from '../../components/Modal';
import { ErrorAlert, Field } from '../../components/ui';
import { payRunSchema, type PayRunValues } from '../../lib/schemas';
import { applyServerErrors } from '../../lib/errors';
import { nextPeriod } from '../../lib/dates';
import { formatMonth } from '../../lib/format';

interface Props {
  latestPeriodEnd?: string;
  payDay?: number;
  onClose: () => void;
}

export function NewPayRunDialog({ latestPeriodEnd, payDay, onClose }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const [create] = useCreatePayRunMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const suggestion = nextPeriod(latestPeriodEnd, payDay);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PayRunValues>({ resolver: zodResolver(payRunSchema), defaultValues: { name: '', ...suggestion } });

  const onSubmit = async (v: PayRunValues) => {
    try {
      const run = await create({ ...v, name: v.name.trim() || undefined }).unwrap();
      toast('success', `Pay run ${run.name} created.`);
      onClose();
      navigate(`/payruns/${run.id}`);
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  return (
    <Modal title="New pay run" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ErrorAlert error={formError} />
        <Field label="Name" htmlFor="run-name" hint="Leave empty to use the month name." error={errors.name?.message}>
          <input id="run-name" placeholder={`e.g. ${formatMonth(suggestion.periodStart)}`} {...register('name')} />
        </Field>
        <div className="form-row">
          <Field label="Period start" htmlFor="run-period-start" error={errors.periodStart?.message}>
            <input id="run-period-start" type="date" {...register('periodStart')} />
          </Field>
          <Field label="Period end" htmlFor="run-period-end" error={errors.periodEnd?.message}>
            <input id="run-period-end" type="date" {...register('periodEnd')} />
          </Field>
        </div>
        <Field label="Pay date" htmlFor="run-pay-date" error={errors.payDate?.message}>
          <input id="run-pay-date" type="date" {...register('payDate')} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            Create pay run
          </button>
        </div>
      </form>
    </Modal>
  );
}
