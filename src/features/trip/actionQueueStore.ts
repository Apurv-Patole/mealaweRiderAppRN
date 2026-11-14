import { create } from 'zustand';

import { STORAGE_KEYS } from '@/config/constants';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { HttpError } from '@/services/http';
import { kvStorage } from '@/services/storage';
import { useAuthStore } from '@/store';

import {
  completeStep,
  dueActions,
  isComplete,
  isRetryableFailure,
  nextStep,
  parseQueue,
  recordFailure,
  recordRetry,
  retryNow,
  TARGET_STATUS,
  type ActionStep,
  type QueuedAction,
} from './actionQueue';
import { completePickup, setOrderStatus, uploadProof } from './tripApi';

interface QueueState {
  items: QueuedAction[];
  hydrate: () => void;
  enqueue: (actions: readonly QueuedAction[]) => void;
  discard: (id: string) => void;
  retry: (id: string) => void;
  /** Sends everything that is due. Safe to call often: only one run happens at a time. */
  process: () => Promise<void>;
}

function persist(items: readonly QueuedAction[]): void {
  kvStorage.setObject(STORAGE_KEYS.actionQueue, items);
}

function describeError(error: unknown): { status: number; message: string } {
  if (error instanceof HttpError) return { status: error.status, message: error.message };
  return { status: 0, message: error instanceof Error ? error.message : 'Something went wrong.' };
}

/** Runs one step of an action against the server and returns the updated action. */
async function runStep(action: QueuedAction, step: ActionStep): Promise<QueuedAction> {
  switch (step) {
    case 'proof':
      return completeStep(action, 'proof', await uploadProof(action));
    case 'complete':
      await completePickup(action);
      return completeStep(action, 'complete');
    case 'status':
      await setOrderStatus(action.orderId, TARGET_STATUS[action.kind], {
        location: action.location,
        proofImageUrl: action.kind === 'delivery' ? action.proofUrl : undefined,
        handOverTo: action.handOverTo,
      });
      return completeStep(action, 'status');
  }
}

let running = false;

export const useActionQueueStore = create<QueueState>((set, get) => {
  /** Replaces one action in the queue (or removes it when `next` is null) and saves. */
  const replace = (id: string, next: QueuedAction | null) => {
    const items = get().items.flatMap((item) => (item.id !== id ? [item] : next ? [next] : []));
    persist(items);
    set({ items });
  };

  return {
    items: [],

    hydrate: () => set({ items: parseQueue(kvStorage.getObject<unknown>(STORAGE_KEYS.actionQueue)) }),

    enqueue: (actions) => {
      const items = [...get().items, ...actions];
      persist(items);
      set({ items });
    },

    discard: (id) => replace(id, null),

    retry: (id) => {
      const target = get().items.find((item) => item.id === id);
      if (target) replace(id, retryNow(target, Date.now()));
    },

    process: async () => {
      if (running) return;
      running = true;
      let finished = 0;
      try {
        for (const due of dueActions(get().items, Date.now())) {
          let current = due;
          for (let step = nextStep(current); step !== null; step = nextStep(current)) {
            try {
              current = await runStep(current, step);
              replace(current.id, current);
            } catch (error: unknown) {
              const { status, message } = describeError(error);
              current = isRetryableFailure(status)
                ? recordRetry(current, message, Date.now())
                : recordFailure(current, message);
              replace(current.id, current);
              break;
            }
          }
          if (isComplete(current)) {
            replace(current.id, null);
            finished += 1;
          }
        }
      } finally {
        running = false;
      }
      // Something reached the server: reload orders so the screen shows the server's truth.
      if (finished > 0) {
        const rider = useAuthStore.getState().rider;
        if (rider) await useOrdersStore.getState().refresh(rider);
      }
    },
  };
});
