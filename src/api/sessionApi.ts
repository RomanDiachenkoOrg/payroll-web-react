import { baseApi } from './baseApi';
import type { User } from './types';

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSession: build.query<User, void>({
      query: () => '/session',
      providesTags: ['Session'],
    }),
    login: build.mutation<User, { email: string; password: string }>({
      query: (body) => ({ url: '/session', method: 'POST', body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/session', method: 'DELETE' }),
    }),
  }),
});

export const { useGetSessionQuery, useLoginMutation, useLogoutMutation } = sessionApi;
