import type { RiderOrder } from '@/features/orders/orderModel';
import { haversineMeters, type LatLng } from '@/lib/geo';

/**
 * Route planner (pure). A port of the Ionic planner:
 *  1. Orders still waiting for pickup are grouped into kitchen stops (kitchens within about 1 m are one stop).
 *  2. Each picked-up order is its own customer stop.
 *  3. The rider visits every kitchen first, nearest next, then every customer, nearest next. A customer
 *     whose order is at a kitchen becomes reachable once that kitchen has been visited.
 *  4. Done and cancelled orders never appear.
 * Difference from the Ionic app: an order with no usable coordinates is REPORTED in `skipped`
 * instead of being placed at a made-up point in central India.
 */
export type StopType = 'kitchen' | 'customer';

export interface RouteStop {
  /** Kitchen stops use the rounded coordinate; customer stops use the order id. */
  id: string;
  type: StopType;
  location: LatLng;
  name: string;
  subtitle: string;
  orders: RiderOrder[];
  /** Estimated road distance from the previous stop (or the rider for the first), in km. */
  distanceFromPrevKm: number | null;
  /** Estimated road distance from the rider, in km. */
  distanceFromRiderKm: number | null;
}

export interface SkippedOrder {
  orderId: string;
  orderNo: string;
  reason: string;
}

export interface RoutePlan {
  stops: RouteStop[];
  skipped: SkippedOrder[];
  /** Sum of realistic legs, in km. */
  totalKm: number;
}

/** Streets curve, so driving distance is longer than the straight line. The standard urban factor. */
export const ROAD_FACTOR = 1.35;
/** A single leg longer than this is almost certainly a geocoding error and is left out of the total. */
export const MAX_LEG_KM = 30;

function roundCoord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

function roadKm(a: LatLng, b: LatLng): number {
  return (haversineMeters(a, b) / 1000) * ROAD_FACTOR;
}

function customerStop(order: RiderOrder, location: LatLng): RouteStop {
  return {
    id: `customer:${order.id}`,
    type: 'customer',
    location,
    name: order.customer.name,
    subtitle: order.customer.address,
    orders: [order],
    distanceFromPrevKm: null,
    distanceFromRiderKm: null,
  };
}

function buildKitchenStops(orders: readonly RiderOrder[]): RouteStop[] {
  const groups = new Map<string, RouteStop>();
  for (const order of orders) {
    const location = order.kitchen.location;
    if (!location) continue;
    const key = `${roundCoord(location.lat)},${roundCoord(location.lng)}`;
    const existing = groups.get(key);
    if (existing) {
      groups.set(key, { ...existing, orders: [...existing.orders, order] });
    } else {
      groups.set(key, {
        id: `kitchen:${key}`,
        type: 'kitchen',
        location,
        name: order.kitchen.name,
        subtitle: order.kitchen.address,
        orders: [order],
        distanceFromPrevKm: null,
        distanceFromRiderKm: null,
      });
    }
  }
  return [...groups.values()];
}

/** Removes and returns the stop nearest to `from`. */
function takeNearest(from: LatLng, candidates: RouteStop[]): RouteStop | null {
  let bestIndex = -1;
  let bestMeters = Infinity;
  candidates.forEach((candidate, index) => {
    const meters = haversineMeters(from, candidate.location);
    if (meters < bestMeters) {
      bestMeters = meters;
      bestIndex = index;
    }
  });
  if (bestIndex < 0) return null;
  const [taken] = candidates.splice(bestIndex, 1);
  return taken ?? null;
}

export function planRoute(orders: readonly RiderOrder[], rider: LatLng | null): RoutePlan {
  const skipped: SkippedOrder[] = [];
  const prePickup: RiderOrder[] = [];
  const postPickup: RiderOrder[] = [];

  for (const order of orders) {
    if (order.lifecycle !== 'prePickup' && order.lifecycle !== 'postPickup') continue;
    if (!order.kitchen.location) {
      skipped.push({ orderId: order.id, orderNo: order.orderNo, reason: 'Kitchen location is missing' });
      continue;
    }
    if (!order.customer.location) {
      skipped.push({ orderId: order.id, orderNo: order.orderNo, reason: 'Customer location is missing' });
      continue;
    }
    (order.lifecycle === 'prePickup' ? prePickup : postPickup).push(order);
  }

  const pendingKitchens = buildKitchenStops(prePickup);
  const pendingCustomers: RouteStop[] = postPickup.map((order) => customerStop(order, order.customer.location as LatLng));

  const ordered: RouteStop[] = [];
  let position: LatLng | null =
    rider ?? pendingKitchens[0]?.location ?? pendingCustomers[0]?.location ?? null;

  // Every kitchen first. Customers of a visited kitchen join the customer pool.
  while (pendingKitchens.length > 0 && position) {
    const kitchen = takeNearest(position, pendingKitchens);
    if (!kitchen) break;
    ordered.push(kitchen);
    position = kitchen.location;
    for (const order of kitchen.orders) {
      pendingCustomers.push(customerStop(order, order.customer.location as LatLng));
    }
  }
  while (pendingCustomers.length > 0 && position) {
    const customer = takeNearest(position, pendingCustomers);
    if (!customer) break;
    ordered.push(customer);
    position = customer.location;
  }

  // Annotate legs and total.
  let previous: LatLng | null = rider;
  let totalKm = 0;
  const stops = ordered.map((stop) => {
    const fromPrev = previous ? roadKm(previous, stop.location) : null;
    if (fromPrev !== null && fromPrev <= MAX_LEG_KM) totalKm += fromPrev;
    previous = stop.location;
    return {
      ...stop,
      distanceFromPrevKm: fromPrev,
      distanceFromRiderKm: rider ? roadKm(rider, stop.location) : null,
    };
  });

  return { stops, skipped, totalKm };
}

export type RouteStage = 'empty' | 'pickup' | 'ready' | 'delivery' | 'complete';

/**
 * Which phase of the run the rider is in:
 *  - `pickup`: at least one kitchen still has orders waiting
 *  - `ready`: everything is picked up, the delivery ride has not started
 *  - `delivery`: the ride has started
 *  - `complete`: orders existed but none are left to work
 *  - `empty`: no orders at all
 */
export function stageOf(plan: RoutePlan, totalOrders: number, deliveryStarted: boolean): RouteStage {
  const hasKitchens = plan.stops.some((stop) => stop.type === 'kitchen');
  if (hasKitchens) return 'pickup';
  const hasCustomers = plan.stops.some((stop) => stop.type === 'customer');
  if (hasCustomers) return deliveryStarted ? 'delivery' : 'ready';
  return totalOrders > 0 ? 'complete' : 'empty';
}

/** True when any picked-up order is already on the way, which means the delivery ride has started. */
export function isDeliveryStarted(orders: readonly RiderOrder[]): boolean {
  return orders.some((order) => order.statusKey === 'outfordelivery' || order.statusKey === 'ontheway');
}

/**
 * Whether the delivery ride has started: either an order is already on the way, or this very shift's
 * ride was started from this phone (saved, because the server may not have reflected it yet).
 */
export function rideStarted(
  orders: readonly RiderOrder[],
  savedShiftId: string | null,
  currentShiftId: string | null,
): boolean {
  if (isDeliveryStarted(orders)) return true;
  return savedShiftId !== null && currentShiftId !== null && savedShiftId === currentShiftId;
}

/** Customer stops, nearest to the rider first (re-sorted as the rider moves). */
export function customerStopsByDistance(stops: readonly RouteStop[], rider: LatLng | null): RouteStop[] {
  const customers = stops.filter((stop) => stop.type === 'customer');
  if (!rider) return customers;
  return [...customers].sort(
    (a, b) => haversineMeters(rider, a.location) - haversineMeters(rider, b.location),
  );
}

/** A readable total, or null when it is not believable (above 100 km almost always means bad coordinates). */
export function formatRouteKm(totalKm: number): string | null {
  if (!Number.isFinite(totalKm) || totalKm <= 0 || totalKm > 100) return null;
  return totalKm < 1 ? `${Math.round(totalKm * 1000)} m` : `${totalKm.toFixed(1)} km`;
}
