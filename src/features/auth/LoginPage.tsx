import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../api/sessionApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loginSchema, type LoginValues } from '../../lib/schemas';
import { errorMessage } from '../../lib/errors';
import { Field } from '../../components/ui';
import { signedIn } from './authSlice';

const DEMO_ACCOUNTS = ['admin@acme.test', 'manager@acme.test', 'employee@acme.test'];

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, expired } = useAppSelector((s) => s.auth);
  const [login, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const u = await login({ email: values.email.trim(), password: values.password }).unwrap();
      dispatch(signedIn(u));
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
      setValue('password', '');
      setFocus('password');
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="login-title">
        <h1 id="login-title">Sign in to Acme Payroll</h1>
        {expired && !serverError && (
          <div className="alert alert-warning" role="alert">
            Your session has expired. Please sign in again.
          </div>
        )}
        {serverError && (
          <div className="alert alert-error" role="alert" data-testid="login-error">
            {serverError}
          </div>
        )}
        <Field label="Email" htmlFor="login-email" error={errors.email?.message}>
          <input id="login-email" type="email" autoComplete="username" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="login-password" error={errors.password?.message}>
          <input id="login-password" type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="demo-accounts muted">
          Demo accounts (password <code>Passw0rd!</code>):{' '}
          {DEMO_ACCOUNTS.map((email, i) => (
            <span key={email}>
              {i > 0 && ' · '}
              <button
                type="button"
                className="link"
                onClick={() => {
                  setValue('email', email);
                  setFocus('password');
                }}
              >
                {email.split('@')[0]}
              </button>
            </span>
          ))}
        </p>
      </form>
    </div>
  );
}
