import { MEAL_SLOTS, type MealSlot } from '@/features/shift/slots';

import type { RiderOrder } from './orderModel';

/**
 * Per-slot numbers for the Orders tab. Same rules as the server's dashboard
 * (`getOrdersDashboard`), computed here from the one orders fetch so the app needs
 * a single request for both the stats and the lists.
 */
export interface SlotStat {
  meal: MealSlot;
  total: number;
  /** Delivered. */
  done: number;
  /** Collected from the kitchen (picked up, on the way, or delivered). */
  pickedUp: number;
  /** Still active: accepted through on the way. */
  pending: number;
  kitchens: number;
  /** Sum of delivered order totals. */
  income: number;
  /** done / total as a whole percent. */
  progressPct: number;
}

const PICKED_UP = new Set(['handedovertodeliveryboy', 'outfordelivery', 'ontheway', 'delivered', 'deliverycompleted']);
const ACTIVE = new Set([
  'accepted', 'preparing', 'readytodelivery', 'readyfordelivery',
  'handedovertodeliveryboy', 'outfordelivery', 'ontheway',
]);

function statFor(meal: MealSlot, orders: readonly RiderOrder[]): SlotStat {
  const mine = orders.filter((order) => order.mealType === meal);
  const delivered = mine.filter((order) => order.lifecycle === 'done');
  const total = mine.length;
  return {
    meal,
    total,
    done: delivered.length,
    pickedUp: mine.filter((order) => PICKED_UP.has(order.statusKey)).length,
    pending: mine.filter((order) => ACTIVE.has(order.statusKey)).length,
    kitchens: new Set(mine.map((order) => order.kitchen.name)).size,
    income: delivered.reduce((sum, order) => sum + order.totalAmount, 0),
    progressPct: total > 0 ? Math.round((delivered.length / total) * 100) : 0,
  };
}

export function statsBySlot(orders: readonly RiderOrder[]): SlotStat[] {
  return MEAL_SLOTS.map((meal) => statFor(meal, orders));
}

/** Delivered share of all orders today, as a whole percent. */
export function completionRate(stats: readonly SlotStat[]): number {
  const total = stats.reduce((sum, stat) => sum + stat.total, 0);
  if (total === 0) return 0;
  return Math.round((stats.reduce((sum, stat) => sum + stat.done, 0) / total) * 100);
}

const LIFECYCLE_RANK = { prePickup: 0, postPickup: 1, unknown: 2, done: 3, cancelled: 4 } as const;

/** Orders for a list: work still to do first, then finished, then cancelled; by order number within each group. */
export function sortForList(orders: readonly RiderOrder[]): RiderOrder[] {
  return [...orders].sort((a, b) => {
    const rank = LIFECYCLE_RANK[a.lifecycle] - LIFECYCLE_RANK[b.lifecycle];
    if (rank !== 0) return rank;
    return a.orderNo.localeCompare(b.orderNo, undefined, { numeric: true });
  });
}

/** Orders still to work (for the Orders tab badge). Counts the given slot, or every slot when omitted. */
export function pendingCount(orders: readonly RiderOrder[], meal?: MealSlot): number {
  return orders.filter((order) => (!meal || order.mealType === meal) && ACTIVE.has(order.statusKey)).length;
}
