import type { LucideIcon } from 'lucide-react-native';

import { useDialogStore, type DialogTone, type SheetOption } from './dialogStore';

interface ConfirmOptions {
  title: string;
  message?: string;
  icon?: LucideIcon;
  /** `danger` makes the confirm button red, for actions that cannot be undone. */
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface NoticeOptions {
  title: string;
  message?: string;
  icon?: LucideIcon;
  okLabel?: string;
}

interface SheetOptions {
  title: string;
  message?: string;
  options: readonly SheetOption[];
}

/**
 * The app's replacement for the plain system alert: rounded in-app dialogs that match the theme.
 * Each call waits for the rider's answer.
 */
export const dialog = {
  /** Asks a yes/no question. Resolves true for the confirm button, false for cancel or tapping outside. */
  confirm: (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      useDialogStore.getState().open({
        kind: 'confirm',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        ...options,
        resolve,
      });
    }),

  /** Shows a message with one button. */
  success: (options: NoticeOptions): Promise<void> =>
    new Promise((resolve) => {
      useDialogStore.getState().open({ kind: 'notice', tone: 'success', okLabel: 'Done', ...options, resolve });
    }),

  /** Shows a problem with one button. */
  error: (options: NoticeOptions): Promise<void> =>
    new Promise((resolve) => {
      useDialogStore.getState().open({ kind: 'notice', tone: 'error', okLabel: 'OK', ...options, resolve });
    }),

  /** A bottom sheet with a list of choices. Resolves with the chosen value, or null when dismissed. */
  choose: (options: SheetOptions): Promise<string | null> =>
    new Promise((resolve) => {
      useDialogStore.getState().open({ kind: 'sheet', ...options, resolve });
    }),
};
