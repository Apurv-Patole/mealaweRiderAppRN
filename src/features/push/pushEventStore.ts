import { create } from 'zustand';

import type { PushEvent } from '@/services/push/notificationData';
import type { PushSource } from './pushReactions';

/**
 * The latest push event the app received. Later stages subscribe to this to refresh
 * the orders list, play an alert sound, or open the attendance screen. The `id`
 * increases for every event so two identical events in a row still re-trigger.
 */
interface PushEventState {
  id: number;
  last: PushEvent | null;
  source: PushSource;
  publish: (event: PushEvent, source?: PushSource) => void;
}

export const usePushEventStore = create<PushEventState>((set) => ({
  id: 0,
  last: null,
  source: 'foreground',
  publish: (event, source = 'foreground') => set((state) => ({ id: state.id + 1, last: event, source })),
}));
