/** Where an order is in its life (pure, no React Native imports). */
export type OrderLifecycle = 'prePickup' | 'postPickup' | 'done' | 'cancelled' | 'unknown';

const PRE_PICKUP = new Set(['readytodelivery', 'readyfordelivery', 'preparing', 'accepted']);
const POST_PICKUP = new Set(['handedovertodeliveryboy', 'outfordelivery', 'ontheway']);
const DONE = new Set(['delivered', 'deliverycompleted']);

/** Lower-case status with spaces, dashes and underscores removed, from whichever field the server sent. */
export function statusKeyOf(order: unknown): string {
  if (!order || typeof order !== 'object') return '';
  const record = order as Record<string, unknown>;
  const raw = String(record.orderstatus ?? record.riderStatus ?? record.status ?? '');
  return raw.replace(/[\s_-]/g, '').toLowerCase();
}

export function lifecycleOfKey(statusKey: string): OrderLifecycle {
  if (!statusKey) return 'unknown';
  if (PRE_PICKUP.has(statusKey)) return 'prePickup';
  if (POST_PICKUP.has(statusKey)) return 'postPickup';
  if (DONE.has(statusKey)) return 'done';
  if (statusKey.startsWith('cancel') || statusKey === 'rejectedbykitchen' || statusKey === 'autocancelled') {
    return 'cancelled';
  }
  return 'unknown';
}

const READY_FOR_PICKUP = new Set(['readytodelivery', 'readyfordelivery']);

/** True once the kitchen has marked the order ready, which is when a rider may pick it up. */
export function isReadyForPickup(statusKey: string): boolean {
  return READY_FOR_PICKUP.has(statusKey);
}

/** Lifecycle of a raw server order. */
export function lifecycleOf(order: unknown): OrderLifecycle {
  return lifecycleOfKey(statusKeyOf(order));
}
