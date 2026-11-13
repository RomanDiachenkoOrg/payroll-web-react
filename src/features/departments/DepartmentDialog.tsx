import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from '../../api/adminApi';
import type { Department, Employee } from '../../api/types';
import { useToast } from '../../app/hooks';
import { Modal } from '../../components/Modal';
import { ErrorAlert, Field } from '../../components/ui';
import { departmentSchema, type DepartmentValues } from '../../lib/schemas';
import { applyServerErrors } from '../../lib/errors';

interface Props {
  department: Department | null;
  employees: Employee[];
  onClose: () => void;
}

export function DepartmentDialog({ department, employees, onClose }: Props) {
  const toast = useToast();
  const [create] = useCreateDepartmentMutation();
  const [update] = useUpdateDepartmentMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? '',
      code: department?.code ?? '',
      costCenter: department?.costCenter ?? '',
      managerEmployeeId: department?.managerEmployeeId ? String(department.managerEmployeeId) : '',
    },
  });

  const onSubmit = async (v: DepartmentValues) => {
    const input = {
      name: v.name.trim(),
      code: v.code.trim().toUpperCase(),
      costCenter: v.costCenter.trim(),
      managerEmployeeId: v.managerEmployeeId ? Number(v.managerEmployeeId) : null,
    };
    try {
      const saved = department ? await update({ id: department.id, ...input }).unwrap() : await create(input).unwrap();
      toast('success', `Department ${saved.name} ${department ? 'saved' : 'created'}.`);
      onClose();
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  return (
    <Modal title={department ? `Edit ${department.name}` : 'New department'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ErrorAlert error={formError} />
        <Field label="Name *" htmlFor="dept-name" error={errors.name?.message}>
          <input id="dept-name" {...register('name')} />
        </Field>
        <div className="form-row">
          <Field label="Code *" htmlFor="dept-code" error={errors.code?.message}>
            <input id="dept-code" maxLength={6} {...register('code')} />
          </Field>
          <Field label="Cost center" htmlFor="dept-cost-center" error={errors.costCenter?.message}>
            <input id="dept-cost-center" {...register('costCenter')} />
          </Field>
        </div>
        <Field label="Manager" htmlFor="dept-manager">
          <select id="dept-manager" {...register('managerEmployeeId')}>
            <option value="">-- None --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.lastName}, {e.firstName}
              </option>
            ))}
          </select>
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {department ? 'Save changes' : 'Create department'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
