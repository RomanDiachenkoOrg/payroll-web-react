import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useCreateEmployeeMutation,
  useGetEmployeeQuery,
  useUpdateEmployeeMutation,
} from '../../api/employeesApi';
import { useGetDeductionTypesQuery, useGetDepartmentsQuery } from '../../api/adminApi';
import type { Employee, EmployeeInput } from '../../api/types';
import { useToast } from '../../app/hooks';
import { ErrorAlert, Field, Loading, PageHeader } from '../../components/ui';
import { employeeSchema, type EmployeeFormValues } from '../../lib/schemas';
import { applyServerErrors } from '../../lib/errors';
import { today } from '../../lib/dates';

const EMPTY: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
  departmentId: '',
  payType: 'salaried',
  annualSalary: '',
  hourlyRate: '',
  hireDate: today(),
  pensionOptIn: false,
  deductions: [],
};

function toFormValues(e: Employee): EmployeeFormValues {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone ?? '',
    title: e.title ?? '',
    departmentId: String(e.departmentId),
    payType: e.payType,
    annualSalary: e.annualSalary != null ? String(e.annualSalary) : '',
    hourlyRate: e.hourlyRate != null ? String(e.hourlyRate) : '',
    hireDate: e.hireDate,
    pensionOptIn: e.pensionOptIn,
    deductions: e.deductions.map((d) => ({ typeId: String(d.typeId), amount: String(d.amount) })),
  };
}

export function toEmployeeInput(v: EmployeeFormValues): EmployeeInput {
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim().toLowerCase(),
    phone: v.phone.trim(),
    title: v.title.trim(),
    departmentId: Number(v.departmentId),
    payType: v.payType,
    annualSalary: v.payType === 'salaried' ? Number(v.annualSalary) : null,
    hourlyRate: v.payType === 'hourly' ? Number(v.hourlyRate) : null,
    hireDate: v.hireDate,
    pensionOptIn: v.pensionOptIn,
    deductions: v.deductions.map((d) => ({ typeId: Number(d.typeId), amount: Number(d.amount) })),
  };
}

export function EmployeeFormPage() {
  const { id } = useParams();
  const employeeId = id ? Number(id) : null;
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: employee, isLoading, error } = useGetEmployeeQuery(employeeId ?? 0, { skip: !employeeId });
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: deductionTypes = [] } = useGetDeductionTypesQuery();
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues: EMPTY });
  const { fields, append, remove } = useFieldArray({ control, name: 'deductions' });

  useEffect(() => {
    if (employee) reset(toFormValues(employee));
  }, [employee, reset]);

  const payType = watch('payType');

  if (employeeId && isLoading) return <Loading />;
  if (employeeId && error) return <ErrorAlert error={error} />;

  const onSubmit = async (values: EmployeeFormValues) => {
    setFormError(null);
    try {
      const input = toEmployeeInput(values);
      const saved = employeeId
        ? await updateEmployee({ id: employeeId, ...input }).unwrap()
        : await createEmployee(input).unwrap();
      toast('success', `${saved.firstName} ${saved.lastName} saved.`);
      navigate(`/employees/${saved.id}`);
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  const title = employee ? `Edit ${employee.firstName} ${employee.lastName}` : 'New employee';

  return (
    <>
      <PageHeader title={title} />
      <form className="card form" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="employee-form">
        <ErrorAlert error={formError} />

        <fieldset>
          <legend>Personal details</legend>
          <div className="form-row">
            <Field label="First name *" htmlFor="emp-first-name" error={errors.firstName?.message}>
              <input id="emp-first-name" {...register('firstName')} />
            </Field>
            <Field label="Last name *" htmlFor="emp-last-name" error={errors.lastName?.message}>
              <input id="emp-last-name" {...register('lastName')} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Email *" htmlFor="emp-email" error={errors.email?.message}>
              <input id="emp-email" type="email" {...register('email')} />
            </Field>
            <Field label="Phone" htmlFor="emp-phone" error={errors.phone?.message}>
              <input id="emp-phone" type="tel" {...register('phone')} />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Employment</legend>
          <div className="form-row">
            <Field label="Department *" htmlFor="emp-department" error={errors.departmentId?.message}>
              <select id="emp-department" {...register('departmentId')}>
                <option value="">-- Select --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job title" htmlFor="emp-title" error={errors.title?.message}>
              <input id="emp-title" {...register('title')} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Hire date *" htmlFor="emp-hire-date" error={errors.hireDate?.message}>
              <input id="emp-hire-date" type="date" {...register('hireDate')} />
            </Field>
            <div className="field">
              <span className="label">Pay type *</span>
              <div className="radio-group" role="radiogroup" aria-label="Pay type">
                <label>
                  <input type="radio" value="salaried" {...register('payType')} /> Salaried
                </label>
                <label>
                  <input type="radio" value="hourly" {...register('payType')} /> Hourly
                </label>
              </div>
            </div>
          </div>
          <div className="form-row">
            {payType === 'salaried' ? (
              <Field label="Annual salary (USD) *" htmlFor="emp-salary" error={errors.annualSalary?.message}>
                <input id="emp-salary" type="number" min="0" step="100" {...register('annualSalary')} />
              </Field>
            ) : (
              <Field label="Hourly rate (USD) *" htmlFor="emp-rate" error={errors.hourlyRate?.message}>
                <input id="emp-rate" type="number" min="0" step="0.25" {...register('hourlyRate')} />
              </Field>
            )}
            <div className="field checkbox">
              <label>
                <input type="checkbox" {...register('pensionOptIn')} /> Enrolled in the pension plan
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Monthly deductions</legend>
          {fields.length === 0 && <p className="muted">No deductions.</p>}
          {fields.map((f, i) => (
            <div className="form-row deduction-row" key={f.id}>
              <Field label="Type" htmlFor={`ded-type-${i}`} error={errors.deductions?.[i]?.typeId?.message}>
                <select
                  id={`ded-type-${i}`}
                  {...register(`deductions.${i}.typeId` as const, {
                    onChange: (e) => {
                      const type = deductionTypes.find((t) => String(t.id) === e.target.value);
                      if (type) setValue(`deductions.${i}.amount`, String(type.defaultAmount));
                    },
                  })}
                >
                  <option value="">-- Select --</option>
                  {deductionTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Amount per month" htmlFor={`ded-amount-${i}`} error={errors.deductions?.[i]?.amount?.message}>
                <input id={`ded-amount-${i}`} type="number" step="0.01" {...register(`deductions.${i}.amount` as const)} />
              </Field>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-sm" onClick={() => append({ typeId: '', amount: '' })}>
            Add deduction
          </button>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {employeeId ? 'Save changes' : 'Create employee'}
          </button>
          <Link
            to={employeeId ? `/employees/${employeeId}` : '/employees'}
            className="btn btn-ghost"
            onClick={(e) => {
              if (isDirty && !window.confirm('Discard your changes?')) e.preventDefault();
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
