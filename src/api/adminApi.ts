import { baseApi } from './baseApi';
import type { AuditEntry, AuditFilter, DeductionType, Department, Settings, User } from './types';

export type DepartmentInput = Pick<Department, 'name' | 'code' | 'costCenter' | 'managerEmployeeId'>;

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDepartments: build.query<Department[], void>({
      query: () => '/departments',
      providesTags: ['Department'],
    }),
    createDepartment: build.mutation<Department, DepartmentInput>({
      query: (body) => ({ url: '/departments', method: 'POST', body }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: build.mutation<Department, { id: number } & DepartmentInput>({
      query: ({ id, ...body }) => ({ url: `/departments/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: build.mutation<void, number>({
      query: (id) => ({ url: `/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Department', 'Dashboard'],
    }),
    getSettings: build.query<Settings, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation<Settings, Omit<Settings, 'currency'>>({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings', 'Audit'],
    }),
    getDeductionTypes: build.query<DeductionType[], void>({
      query: () => '/deduction-types',
    }),
    getUsers: build.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getAuditLog: build.query<AuditEntry[], AuditFilter>({
      query: (filter) => {
        const params = Object.fromEntries(Object.entries(filter).filter(([, v]) => v));
        return { url: '/audit', params };
      },
      providesTags: ['Audit'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetDeductionTypesQuery,
  useGetUsersQuery,
  useGetAuditLogQuery,
} = adminApi;
