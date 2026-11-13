import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { sessionExpired } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? '/api',
  credentials: 'same-origin',
});

/** Logs the user out locally when any call (other than the session check) returns 401. */
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith('/session')) {
    api.dispatch(sessionExpired());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Session',
    'Dashboard',
    'Employee',
    'SalaryHistory',
    'Department',
    'Timesheet',
    'PayRun',
    'Payslip',
    'Settings',
    'User',
    'Audit',
    'Report',
  ],
  endpoints: () => ({}),
});
