import type { LucideIcon } from 'lucide-react-native';
import { create } from 'zustand';

export type DialogTone = 'default' | 'danger' | 'success' | 'error';

export interface ConfirmRequest {
  kind: 'confirm';
  title: string;
  message?: string;
  icon?: LucideIcon;
  tone?: DialogTone;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (confirmed: boolean) => void;
}

export interface NoticeRequest {
  kind: 'notice';
  title: string;
  message?: string;
  icon?: LucideIcon;
  tone: DialogTone;
  okLabel: string;
  resolve: () => void;
}

export interface SheetOption {
  value: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
}

export interface SheetRequest {
  kind: 'sheet';
  title: string;
  message?: string;
  options: readonly SheetOption[];
  resolve: (value: string | null) => void;
}

export type DialogRequest = ConfirmRequest | NoticeRequest | SheetRequest;

interface DialogState {
  /** The dialog on screen. */
  current: DialogRequest | null;
  /** Dialogs waiting their turn, so two calls in a row never stack on top of each other. */
  queue: readonly DialogRequest[];
  open: (request: DialogRequest) => void;
  /** Closes the current dialog and shows the next one waiting. */
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  current: null,
  queue: [],
  open: (request) =>
    set((state) => (state.current ? { queue: [...state.queue, request] } : { current: request })),
  close: () =>
    set((state) => {
      const [next, ...rest] = state.queue;
      return { current: next ?? null, queue: rest };
    }),
}));
