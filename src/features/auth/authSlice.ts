import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../api/types';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** set when the server rejected a call because the session timed out */
  expired: boolean;
}

const initialState: AuthState = { status: 'checking', user: null, expired: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<User>) {
      state.status = 'authenticated';
      state.user = action.payload;
      state.expired = false;
    },
    signedOut(state) {
      state.status = 'anonymous';
      state.user = null;
      state.expired = false;
    },
    sessionExpired(state) {
      if (state.status === 'authenticated') {
        state.expired = true;
      }
      state.status = 'anonymous';
      state.user = null;
    },
  },
});

export const { signedIn, signedOut, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
