import { baseApi } from './baseApi';
import type { CostReport, DashboardData, PayRun, PayRunInput, PayslipDetail } from './types';

type PayRunAction = 'calculate' | 'approve' | 'pay';

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query<DashboardData, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    getPayRuns: build.query<PayRun[], void>({
      query: () => '/payruns',
      providesTags: [{ type: 'PayRun', id: 'LIST' }],
    }),
    getPayRun: build.query<PayRun, number>({
      query: (id) => `/payruns/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PayRun', id }],
    }),
    createPayRun: build.mutation<PayRun, PayRunInput>({
      query: (body) => ({ url: '/payruns', method: 'POST', body }),
      invalidatesTags: [{ type: 'PayRun', id: 'LIST' }],
    }),
    payRunAction: build.mutation<PayRun, { id: number; action: PayRunAction }>({
      query: ({ id, action }) => ({ url: `/payruns/${id}/${action}`, method: 'POST' }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PayRun', id },
        { type: 'PayRun', id: 'LIST' },
        'Payslip',
        'Dashboard',
        'Report',
      ],
    }),
    deletePayRun: build.mutation<void, number>({
      query: (id) => ({ url: `/payruns/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'PayRun', id: 'LIST' }],
    }),
    getPayslip: build.query<PayslipDetail, number>({
      query: (id) => `/payslips/${id}`,
      providesTags: ['Payslip'],
    }),
    getCostReport: build.query<CostReport, { from: string; to: string; includeUnpaid: boolean }>({
      query: ({ from, to, includeUnpaid }) => ({
        url: '/reports/department-cost',
        params: { from, to, includeUnpaid: String(includeUnpaid) },
      }),
      providesTags: ['Report'],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetPayRunsQuery,
  useGetPayRunQuery,
  useCreatePayRunMutation,
  usePayRunActionMutation,
  useDeletePayRunMutation,
  useGetPayslipQuery,
  useGetCostReportQuery,
} = payrollApi;
