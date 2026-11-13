import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import authReducer, { signedOut } from '../features/auth/authSlice';
import toastReducer from './toastSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  toast: toastReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function setupStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
  return store;
}

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

/** Drops every cached query, e.g. after signing out so the next user does not see stale data. */
export function resetSession(dispatch: AppDispatch) {
  dispatch(signedOut());
  dispatch(baseApi.util.resetApiState());
}
