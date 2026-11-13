import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { dismissToast, type Toast } from '../app/toastSlice';

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (toast.kind === 'error') return;
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 5000);
    return () => clearTimeout(timer);
  }, [dispatch, toast]);

  return (
    <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss" onClick={() => dispatch(dismissToast(toast.id))}>
        ×
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useAppSelector((s) => s.toast);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
