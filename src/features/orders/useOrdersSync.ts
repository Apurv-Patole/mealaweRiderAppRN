import { useEffect } from 'react';

import { isShiftOnline } from '@/features/shift/shiftModel';
import { useShiftStore } from '@/features/shift/shiftStore';
import { attendanceSlot } from '@/features/shift/slots';
import { usePolling } from '@/hooks/usePolling';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { useAuthStore } from '@/store';
import { useTabBadgeStore } from '@/store/tabBadgeStore';

import { pendingCount } from './orderStats';
import { useOrdersStore } from './ordersStore';

/** How often orders are refreshed while the app is open. Push (new order, cancel) nudges sooner. */
const ORDERS_POLL_MS = 60_000;

/**
 * Keeps the orders store fresh for the whole signed-in session (mounted once, in the tabs layout):
 * polls every minute while the app is in the foreground, reloads at once when the date or clusters
 * change, and keeps the Orders tab badge equal to the orders still to work in the current slot.
 */
export function useOrdersSync(): void {
  const rider = useAuthStore((state) => state.rider);
  const dateOffset = useOrdersStore((state) => state.dateOffset);
  const clusterSelection = useOrdersStore((state) => state.clusterSelection);
  const orders = useEffectiveOrders();
  const slots = useShiftStore((state) => state.slots);
  const setOrdersCount = useTabBadgeStore((state) => state.setOrdersCount);

  usePolling(
    async () => {
      if (!rider) return true;
      // While a shift is running, also reload it so Home shows the distance the server has counted.
      if (isShiftOnline(useShiftStore.getState().shift)) void useShiftStore.getState().refresh(rider);
      return useOrdersStore.getState().refresh(rider);
    },
    ORDERS_POLL_MS,
    rider !== null,
    `${rider?.riderId ?? ''}|${dateOffset}|${clusterSelection?.join(',') ?? 'all'}`,
  );

  useEffect(() => {
    // The badge is about today's work, so a future date shows nothing.
    const meal = attendanceSlot(slots, new Date()).meal;
    setOrdersCount(dateOffset === 0 ? pendingCount(orders, meal) : 0);
  }, [orders, slots, dateOffset, setOrdersCount]);
}
