import { useEffect } from 'react';

import { usePolling } from '@/hooks/usePolling';
import { useAuthStore } from '@/store';

import { pendingActions } from './actionQueue';
import { useActionQueueStore } from './actionQueueStore';
import { resumePendingProof } from './tripActions';

/** How often waiting updates are retried while the app is open and something is waiting. */
const QUEUE_POLL_MS = 15_000;

/**
 * Sends waiting pickup and delivery updates (mounted once, in the tabs layout). It retries every 15 s while
 * anything is waiting, at once when the app returns to the foreground, and at once when a new action is
 * queued. It also finishes a proof photo that Android took out of the app while the camera was open.
 */
export function useActionQueueSync(): void {
  const rider = useAuthStore((state) => state.rider);
  const waiting = useActionQueueStore((state) => pendingActions(state.items).length);

  usePolling(
    async () => {
      await useActionQueueStore.getState().process();
      return pendingActions(useActionQueueStore.getState().items).every((action) => action.error === null);
    },
    QUEUE_POLL_MS,
    waiting > 0,
    String(waiting),
  );

  const riderId = rider?.riderId;
  useEffect(() => {
    const current = useAuthStore.getState().rider;
    if (current) void resumePendingProof(current).catch(() => undefined);
  }, [riderId]);
}
