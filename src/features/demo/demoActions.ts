import { dialog } from '@/components/dialog/dialog';
import { logout } from '@/features/auth/authApi';
import { useAuthStore } from '@/store';
import { haptics } from '@/utils/haptics';

import { resetDemo } from './demoLifecycle';

/** Asks first, then puts the demo back to its starting state (new orders, no shift, empty wallet). */
export async function confirmRestartDemo(): Promise<void> {
  const confirmed = await dialog.confirm({
    title: 'Restart the demo?',
    message: 'Orders, shift and wallet go back to the start.',
    confirmLabel: 'Restart',
    cancelLabel: 'Keep going',
  });
  if (!confirmed) return;
  haptics.confirm();
  await resetDemo();
}

/** Asks first, then leaves the demo and returns to the login screen. */
export async function confirmExitDemo(): Promise<void> {
  const confirmed = await dialog.confirm({
    title: 'Exit the demo?',
    message: 'You will return to the login screen.',
    confirmLabel: 'Exit demo',
    cancelLabel: 'Stay',
  });
  if (confirmed) void logout().finally(() => useAuthStore.getState().clearSession());
}
