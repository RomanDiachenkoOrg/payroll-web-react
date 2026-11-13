import { baseApi } from './baseApi';
import type { Employee, EmployeeInput, EmployeePayslip, SalaryChange } from './types';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<Employee[], void>({
      query: () => '/employees',
      providesTags: (result) => [
        { type: 'Employee', id: 'LIST' },
        ...(result ?? []).map((e) => ({ type: 'Employee' as const, id: e.id })),
      ],
    }),
    getEmployee: build.query<Employee, number>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: build.mutation<Employee, EmployeeInput>({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }, 'Department', 'Dashboard'],
    }),
    updateEmployee: build.mutation<Employee, { id: number } & EmployeeInput>({
      query: ({ id, ...body }) => ({ url: `/employees/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee', id }, 'Department', 'Dashboard'],
    }),
    setEmployeeActive: build.mutation<Employee, { id: number; active: boolean }>({
      query: ({ id, active }) => ({ url: `/employees/${id}/${active ? 'activate' : 'deactivate'}`, method: 'POST' }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Employee', id }, 'Department', 'Dashboard'],
    }),
    getSalaryHistory: build.query<SalaryChange[], number>({
      query: (id) => `/employees/${id}/salary-history`,
      providesTags: (_r, _e, id) => [{ type: 'SalaryHistory', id }],
    }),
    addSalaryChange: build.mutation<SalaryChange, { employeeId: number; effectiveDate: string; amount: number; reason: string }>({
      query: ({ employeeId, ...body }) => ({ url: `/employees/${employeeId}/salary-history`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { employeeId }) => [
        { type: 'SalaryHistory', id: employeeId },
        { type: 'Employee', id: employeeId },
      ],
    }),
    getEmployeePayslips: build.query<EmployeePayslip[], number>({
      query: (id) => `/employees/${id}/payslips`,
      providesTags: ['Payslip'],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useSetEmployeeActiveMutation,
  useGetSalaryHistoryQuery,
  useAddSalaryChangeMutation,
  useGetEmployeePayslipsQuery,
} = employeesApi;
