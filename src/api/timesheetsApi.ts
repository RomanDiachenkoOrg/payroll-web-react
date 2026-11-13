import { baseApi } from './baseApi';
import type { Timesheet, TimesheetInput, TimesheetStatus } from './types';

const changed = ['Dashboard' as const, { type: 'Timesheet' as const, id: 'LIST' }];

export const timesheetsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTimesheets: build.query<Timesheet[], TimesheetStatus | ''>({
      query: (status) => ({ url: '/timesheets', params: status ? { status } : undefined }),
      providesTags: (result) => [
        { type: 'Timesheet', id: 'LIST' },
        ...(result ?? []).map((t) => ({ type: 'Timesheet' as const, id: t.id })),
      ],
    }),
    getTimesheet: build.query<Timesheet, number>({
      query: (id) => `/timesheets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Timesheet', id }],
    }),
    createTimesheet: build.mutation<Timesheet, TimesheetInput>({
      query: (body) => ({ url: '/timesheets', method: 'POST', body }),
      invalidatesTags: changed,
    }),
    updateTimesheet: build.mutation<Timesheet, { id: number } & TimesheetInput>({
      query: ({ id, ...body }) => ({ url: `/timesheets/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [...changed, { type: 'Timesheet', id }],
    }),
    deleteTimesheet: build.mutation<void, number>({
      query: (id) => ({ url: `/timesheets/${id}`, method: 'DELETE' }),
      invalidatesTags: changed,
    }),
    submitTimesheet: build.mutation<Timesheet, number>({
      query: (id) => ({ url: `/timesheets/${id}/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [...changed, { type: 'Timesheet', id }],
    }),
    approveTimesheet: build.mutation<Timesheet, number>({
      query: (id) => ({ url: `/timesheets/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [...changed, { type: 'Timesheet', id }],
    }),
    rejectTimesheet: build.mutation<Timesheet, { id: number; reason: string }>({
      query: ({ id, reason }) => ({ url: `/timesheets/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: (_r, _e, { id }) => [...changed, { type: 'Timesheet', id }],
    }),
  }),
});

export const {
  useGetTimesheetsQuery,
  useGetTimesheetQuery,
  useCreateTimesheetMutation,
  useUpdateTimesheetMutation,
  useDeleteTimesheetMutation,
  useSubmitTimesheetMutation,
  useApproveTimesheetMutation,
  useRejectTimesheetMutation,
} = timesheetsApi;
