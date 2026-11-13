import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { showToast, type ToastKind } from './toastSlice';
import { can, type Permission } from '../lib/permissions';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export function useCurrentUser() {
  return useAppSelector((s) => s.auth.user);
}

export function useCan() {
  const user = useCurrentUser();
  return useCallback((permission: Permission) => can(user, permission), [user]);
}

export function useToast() {
  const dispatch = useAppDispatch();
  return useCallback((kind: ToastKind, message: string) => dispatch(showToast(kind, message)), [dispatch]);
}
