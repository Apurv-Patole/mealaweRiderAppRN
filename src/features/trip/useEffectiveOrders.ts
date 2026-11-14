import type { RiderOrder } from '@/features/orders/orderModel';
import { useOrdersStore } from '@/features/orders/ordersStore';

import { applyPending } from './actionQueue';
import { useActionQueueStore } from './actionQueueStore';

/**
 * Today's orders as the rider has already left them: an order with a waiting pickup or delivery shows as
 * picked up or delivered at once, instead of snapping back until the update reaches the server.
 */
export function useEffectiveOrders(): RiderOrder[] {
  const orders = useOrdersStore((state) => state.orders);
  const queue = useActionQueueStore((state) => state.items);
  return applyPending(orders, queue);
}
