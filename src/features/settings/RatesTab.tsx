import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../api/adminApi';
import type { Settings } from '../../api/types';
import { useToast } from '../../app/hooks';
import { ErrorAlert, Field, Loading } from '../../components/ui';
import { settingsSchema, type SettingsValues } from '../../lib/schemas';
import { applyServerErrors } from '../../lib/errors';

const toPct = (rate: number) => String(Math.round(rate * 10000) / 100);
const fromPct = (value: string) => Math.round(Number(value) * 100) / 10000;

export function toSettingsValues(s: Settings): SettingsValues {
  return {
    brackets: s.taxBrackets.map((b) => ({ from: String(b.from), to: b.to === null ? '' : String(b.to), rate: toPct(b.rate) })),
    socialRate: toPct(s.socialRate),
    pensionRate: toPct(s.pensionRate),
    payDay: String(s.payDay),
  };
}

export function fromSettingsValues(v: SettingsValues): Omit<Settings, 'currency'> {
  return {
    taxBrackets: v.brackets.map((b, i) => ({
      from: Number(b.from),
      to: i === v.brackets.length - 1 ? null : Number(b.to),
      rate: fromPct(b.rate),
    })),
    socialRate: fromPct(v.socialRate),
    pensionRate: fromPct(v.pensionRate),
    payDay: Number(v.payDay),
  };
}

export function RatesTab() {
  const toast = useToast();
  const { data, isLoading, error } = useGetSettingsQuery();
  const [save] = useUpdateSettingsMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema) });
  const { fields, append, replace } = useFieldArray({ control, name: 'brackets' });
  const brackets = watch('brackets');

  useEffect(() => {
    if (data) reset(toSettingsValues(data));
  }, [data, reset]);

  if (isLoading || !brackets) return <Loading />;
  if (error) return <ErrorAlert error={error} />;

  const addBracket = () => {
    const last = brackets[brackets.length - 1];
    const newUpper = String(Number(last.from) + 1000);
    setValue(`brackets.${brackets.length - 1}.to`, newUpper, { shouldDirty: true });
    append({ from: newUpper, to: '', rate: last.rate });
  };

  // keep brackets contiguous: each "from" follows the previous "to", the last one is open-ended
  const removeBracket = (index: number) => {
    const next = brackets.filter((_, i) => i !== index).map((b) => ({ ...b }));
    next.forEach((b, i) => {
      b.from = i === 0 ? '0' : next[i - 1].to;
    });
    next[next.length - 1].to = '';
    replace(next);
  };

  const onSubmit = async (v: SettingsValues) => {
    setFormError(null);
    try {
      const saved = await save(fromSettingsValues(v)).unwrap();
      reset(toSettingsValues({ ...saved, currency: 'USD' }));
      toast('success', 'Settings saved.');
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate data-testid="rates-form">
      <ErrorAlert error={formError} />
      <h2>
        Income tax brackets <small className="muted">monthly gross, progressive</small>
      </h2>
      <table className="table compact narrow" data-testid="tax-brackets">
        <thead>
          <tr>
            <th>From (USD)</th>
            <th>To (USD)</th>
            <th>Rate (%)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => {
            const last = i === fields.length - 1;
            return (
              <tr key={f.id}>
                <td>
                  <input aria-label={`Bracket ${i + 1} from`} readOnly {...register(`brackets.${i}.from` as const)} />
                </td>
                <td>
                  <input
                    aria-label={`Bracket ${i + 1} to`}
                    type={last ? 'text' : 'number'}
                    readOnly={last}
                    placeholder={last ? 'and above' : undefined}
                    {...register(`brackets.${i}.to` as const, {
                      onChange: (e) => !last && setValue(`brackets.${i + 1}.from`, e.target.value),
                    })}
                  />
                  {errors.brackets?.[i]?.to && <small className="field-error">{errors.brackets[i]?.to?.message}</small>}
                </td>
                <td>
                  <input aria-label={`Bracket ${i + 1} rate`} type="number" step="0.01" {...register(`brackets.${i}.rate` as const)} />
                  {errors.brackets?.[i]?.rate && <small className="field-error">{errors.brackets[i]?.rate?.message}</small>}
                </td>
                <td>
                  {fields.length > 1 && (
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeBracket(i)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" className="btn btn-sm" onClick={addBracket}>
        Add bracket
      </button>

      <h2>Contributions</h2>
      <div className="form-row three">
        <Field label="Social contribution (%)" htmlFor="social-rate" error={errors.socialRate?.message}>
          <input id="social-rate" type="number" step="0.01" {...register('socialRate')} />
        </Field>
        <Field label="Pension (%)" htmlFor="pension-rate" error={errors.pensionRate?.message}>
          <input id="pension-rate" type="number" step="0.01" {...register('pensionRate')} />
        </Field>
        <Field label="Pay day of month" htmlFor="pay-day" error={errors.payDay?.message}>
          <input id="pay-day" type="number" min="1" max="28" {...register('payDay')} />
        </Field>
      </div>
      <p className="muted small">Changes apply to pay runs calculated after saving. Paid pay runs are not affected.</p>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isDirty}>
          Save settings
        </button>
        <button type="button" className="btn btn-ghost" disabled={!isDirty} onClick={() => data && reset(toSettingsValues(data))}>
          Discard changes
        </button>
      </div>
    </form>
  );
}
