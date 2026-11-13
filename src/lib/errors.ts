import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '../api/types';

type QueryError = FetchBaseQueryError | SerializedError | undefined | null;

function apiBody(error: QueryError): ApiError | null {
  if (error && 'status' in error && typeof error.data === 'object' && error.data && 'error' in error.data) {
    return error.data as ApiError;
  }
  return null;
}

export function errorMessage(error: unknown): string {
  const e = error as QueryError;
  const body = apiBody(e);
  if (body) return body.error;
  if (e && 'status' in e && e.status === 'FETCH_ERROR') {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  if (e && 'status' in e) return `Something went wrong (${e.status}). Please try again.`;
  return 'Something went wrong. Please try again.';
}

export function errorStatus(error: unknown): number | string | undefined {
  const e = error as QueryError;
  return e && 'status' in e ? e.status : undefined;
}

/** Copies `fields` from a 422 response onto react-hook-form fields. Returns the general message. */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): string {
  const body = apiBody(error as QueryError);
  if (body?.fields) {
    for (const [name, message] of Object.entries(body.fields)) {
      setError(name as Path<T>, { type: 'server', message });
    }
  }
  return errorMessage(error);
}
