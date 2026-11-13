import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextId = 1;

const toastSlice = createSlice({
  name: 'toast',
  initialState: [] as Toast[],
  reducers: {
    showToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.push(action.payload);
        if (state.length > 3) state.shift();
      },
      prepare(kind: ToastKind, message: string) {
        return { payload: { id: nextId++, kind, message } };
      },
    },
    dismissToast(state, action: PayloadAction<number>) {
      return state.filter((t) => t.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
