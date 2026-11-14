import type { LatLng } from '@/lib/geo';

import type { RiderOrder } from './orderModel';

/** The screen title: "Order #DM1001". */
export function orderTitle(order: Pick<RiderOrder, 'orderNo'>): string {
  return `Order #${order.orderNo}`;
}

/** Turns a server order type into words: "allDay" becomes "All day", "advance_order" becomes "Advance order". */
export function orderTypeLabel(type: string): string {
  const spaced = type
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : '';
}

export interface PickupCheck {
  /** The rider has a running shift (pickups are recorded against it). */
  hasShift: boolean;
  riderLocation: LatLng | null;
  kitchenLocation: LatLng | null;
  /** How close the rider must be to the kitchen, in metres. */
  proximityM: number;
  /** Straight-line distance in metres, when both positions are known. */
  distanceM: number | null;
}

/**
 * Why "Complete Pickup" cannot go ahead yet, in words for the rider, or null when it can. The same rules as the
 * Route tab: a running shift, a known position, and being within the kitchen's proximity limit.
 */
export function pickupBlockReason(check: PickupCheck): string | null {
  if (!check.hasShift) return 'Start your shift on the Route tab before you collect an order.';
  if (!check.kitchenLocation) return null;
  if (!check.riderLocation || check.distanceM === null) return 'Waiting for your location. Keep GPS on and try again in a moment.';
  if (check.distanceM > check.proximityM) return `Get within ${check.proximityM} m of the kitchen to complete the pickup.`;
  return null;
}
