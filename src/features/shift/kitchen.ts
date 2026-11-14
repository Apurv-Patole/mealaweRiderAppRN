import { lifecycleOf } from '@/features/orders/lifecycle';
import { haversineMeters, toLatLng, type LatLng } from '@/lib/geo';

/**
 * Finds the kitchen a rider should go to first (pure, no React Native imports).
 * Mirrors the Ionic route planner: only orders still waiting for pickup count, they are
 * grouped by kitchen location (rounded to 5 decimals, about 1 m), and the nearest kitchen
 * to the rider comes first.
 */
export { lifecycleOf, type OrderLifecycle } from '@/features/orders/lifecycle';

export interface KitchenStop {
  name: string;
  address1: string;
  address2: string;
  location: LatLng;
  /** Orders waiting for pickup at this kitchen. */
  orderCount: number;
}

export interface KitchenSummary {
  /** Orders still waiting for pickup, whether or not their kitchen could be located. */
  pendingOrders: number;
  /** The nearest located kitchen, or null when none could be located. */
  first: KitchenStop | null;
}

function roundCoord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

function addressLine(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Summarises the pre-pickup orders into kitchens and picks the one to visit first. */
export function summariseKitchens(orders: readonly unknown[], rider: LatLng | null): KitchenSummary {
  const stops = new Map<string, KitchenStop>();
  let pendingOrders = 0;

  for (const order of orders) {
    if (lifecycleOf(order) !== 'prePickup') continue;
    pendingOrders += 1;

    const record = order as Record<string, unknown>;
    const location = toLatLng(record.kitchenGeolocation);
    if (!location) continue;

    const key = `${roundCoord(location.lat)},${roundCoord(location.lng)}`;
    const existing = stops.get(key);
    if (existing) {
      stops.set(key, { ...existing, orderCount: existing.orderCount + 1 });
      continue;
    }
    const address = (record.kitchenAddress ?? {}) as Record<string, unknown>;
    stops.set(key, {
      name: addressLine(record.kitchenName) || 'Kitchen',
      address1: addressLine(address.address1),
      address2: addressLine(address.address2),
      location,
      orderCount: 1,
    });
  }

  const candidates = [...stops.values()];
  const first = rider
    ? candidates.reduce<KitchenStop | null>(
        (best, stop) =>
          best === null || haversineMeters(rider, stop.location) < haversineMeters(rider, best.location) ? stop : best,
        null,
      )
    : (candidates[0] ?? null);

  return { pendingOrders, first };
}
