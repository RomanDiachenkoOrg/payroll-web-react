import type { ReactNode } from 'react';
import { errorMessage } from '../lib/errors';

const STATUS_CLASS: Record<string, string> = {
  Draft: 'badge-gray',
  Submitted: 'badge-blue',
  Approved: 'badge-green',
  Rejected: 'badge-red',
  Calculated: 'badge-amber',
  Paid: 'badge-purple',
  Active: 'badge-green',
  Inactive: 'badge-gray',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_CLASS[status] ?? 'badge-gray'}`}>{status}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="loading" role="status">
      {label}
    </p>
  );
}

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      {typeof error === 'string' ? error : errorMessage(error)}
    </div>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className ?? ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <small className="hint">{hint}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

export function StatCard({ label, value, note, testId }: { label: string; value: ReactNode; note?: ReactNode; testId?: string }) {
  return (
    <div className="stat" data-testid={testId}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
