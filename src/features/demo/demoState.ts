import { buildSlots, hourOf, nearestSlot, parseHHmm, DEFAULT_SLOT_CONFIG } from '@/features/shift/slots';
import { haversineMeters, type LatLng } from '@/lib/geo';

import {
  buildOrder,
  DEMO_CUSTOMERS,
  DEMO_KITCHENS,
  type DemoOrder,
  type DemoOrderStatus,
} from './demoData';
import { DEMO_RIDER_ID } from './demoSession';

/** The demo server's in-memory world. Every change builds a new state object (nothing is mutated). */

export interface DemoShift {
  _id: string;
  riderId: string;
  date: string;
  mealSlot: string;
  routeNo: string;
  status: 'online' | 'completed';
  stage: 'pickup_stage' | 'delivery_stage' | 'completed';
  startedAt: string;
  endedAt: string | null;
  totalActualKm: number;
}

export interface DemoWorld {
  createdAt: number;
  mealType: string;
  orders: DemoOrder[];
  shift: DemoShift | null;
  shiftStartedMs: number | null;
  startKm: number;
  distanceKm: number;
  extraIncentives: Record<string, unknown>[];
  extraLedger: Record<string, unknown>[];
  extraShifts: DemoShift[];
}

const KM_PER_DELIVERY_RUPEES = 4;
const RUPEES_PER_ORDER = 15;
const HOLD_DAYS = 7;
const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function hhmm(hour: number): string {
  const total = Math.max(0, Math.min(23 * 60 + 59, Math.round(hour * 60)));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function createWorld(now: Date): DemoWorld {
  const mealType = nearestSlot(buildSlots(null), now).meal;
  return {
    createdAt: now.getTime(),
    mealType,
    orders: DEMO_CUSTOMERS.map((spec) => buildOrder(spec, mealType, now)),
    shift: null,
    shiftStartedMs: null,
    startKm: 0,
    distanceKm: 0,
    extraIncentives: [],
    extraLedger: [],
    extraShifts: [],
  };
}

let world: DemoWorld = createWorld(new Date());

export function getWorld(): DemoWorld {
  return world;
}

export function resetWorld(): void {
  world = createWorld(new Date());
}

function update(next: Partial<DemoWorld>): void {
  world = { ...world, ...next };
}

/**
 * Slot windows for the demo: the demo meal's window is widened so that it is open right now (and for a few
 * hours), so attendance can always be marked whatever time of day the demo is run.
 */
export function slotConfig(now: Date): Record<string, unknown> {
  const config: Record<string, { startTime: string; endTime: string; earlyLoginCutoff?: string }> = {
    breakfast: { ...DEFAULT_SLOT_CONFIG.breakfast },
    lunch: { ...DEFAULT_SLOT_CONFIG.lunch },
    dinner: { ...DEFAULT_SLOT_CONFIG.dinner },
  };
  const meals = ['breakfast', 'lunch', 'dinner'] as const;
  // The meal nearest to the clock, so a demo left open across a meal change still has an open slot.
  const index = meals.findIndex((meal) => meal.toLowerCase() === nearestSlot(buildSlots(null), now).meal.toLowerCase());
  const key = meals[Math.max(0, index)]!;
  const own = config[key]!;
  const nextKey = meals[index + 1];
  const nextStart = nextKey ? (parseHHmm(config[nextKey]!.startTime) ?? 24) - 1 / 60 : 23.98;
  const hour = hourOf(now);
  const start = Math.min(parseHHmm(own.startTime) ?? 0, Math.max(0, hour - 1));
  const end = Math.min(nextStart, Math.max(parseHHmm(own.endTime) ?? 24, hour + 4));
  config[key] = { ...own, startTime: hhmm(start), endTime: hhmm(end) };
  return config;
}

function withStatus(order: DemoOrder, status: DemoOrderStatus, extra: Partial<DemoOrder> = {}): DemoOrder {
  return {
    ...order,
    ...extra,
    orderstatus: status,
    statusHistory: [...order.statusHistory, { orderstatus: status, updatedOn: new Date().toISOString() }],
  };
}

/** Kitchens mark their orders ready some seconds after the shift starts. Applied whenever orders are read. */
export function tickKitchens(nowMs: number): DemoOrder[] {
  if (world.shiftStartedMs === null) return world.orders;
  const elapsedSec = (nowMs - world.shiftStartedMs) / 1000;
  let changed = false;
  const orders = world.orders.map((order) => {
    const kitchen = DEMO_KITCHENS.find((candidate) => candidate.key === order.kitchenKey);
    if (order.orderstatus !== 'preparing' || !kitchen || elapsedSec < kitchen.readyAfterSec) return order;
    changed = true;
    return withStatus(order, 'readyToDelivery');
  });
  if (changed) update({ orders });
  return orders;
}

export function setOrderStatus(
  orderId: string,
  status: DemoOrderStatus,
  extra: Partial<DemoOrder> = {},
): DemoOrder | null {
  const current = world.orders.find((order) => order._id === orderId);
  if (!current) return null;
  if (current.orderstatus === status) return current;
  const next = withStatus(current, status, extra);
  update({ orders: world.orders.map((order) => (order._id === orderId ? next : order)) });
  return next;
}

export function setPickupProof(orderId: string, url: string): void {
  update({ orders: world.orders.map((order) => (order._id === orderId ? { ...order, pickupProofUrl: url } : order)) });
}

/** Every picked-up order becomes "on the way" and the shift moves to the delivery stage. */
export function startRide(): number {
  let count = 0;
  const orders = world.orders.map((order) => {
    if (order.orderstatus !== 'handedOverToDeliveryBoy') return order;
    count += 1;
    return withStatus(order, 'onTheWay');
  });
  update({ orders, shift: world.shift ? { ...world.shift, stage: 'delivery_stage' } : null });
  return count;
}

export function startShift(startKm: number, routeNo: string, mealSlot: string): DemoShift {
  const now = new Date();
  const shift: DemoShift = {
    _id: `demo-shift-${now.getTime()}`,
    riderId: DEMO_RIDER_ID,
    date: dateKey(now),
    mealSlot,
    routeNo,
    status: 'online',
    stage: 'pickup_stage',
    startedAt: now.toISOString(),
    endedAt: null,
    totalActualKm: 0,
  };
  update({ shift, shiftStartedMs: now.getTime(), startKm, distanceKm: 0 });
  return shift;
}

export function addDistance(km: number): void {
  if (world.shift?.status !== 'online') return;
  update({ distanceKm: world.distanceKm + km });
}

/** The shift as the server would report it, with the distance counted so far. */
export function currentShift(): DemoShift | null {
  return world.shift ? { ...world.shift, totalActualKm: Math.round(world.distanceKm * 10) / 10 } : null;
}

/** Ends the shift, books an incentive (held for 7 days) and returns the ended shift. */
export function endShift(): DemoShift | null {
  const shift = currentShift();
  if (!shift) return null;
  const now = new Date();
  const delivered = world.orders.filter((order) => order.orderstatus === 'delivered').length;
  const km = shift.totalActualKm;
  const ordersEarned = delivered * RUPEES_PER_ORDER;
  const kmEarned = Math.round(km * KM_PER_DELIVERY_RUPEES);
  const streakEarned = 20;
  const onTimeEarned = delivered > 0 ? 30 : 0;
  const total = ordersEarned + kmEarned + streakEarned + onTimeEarned;
  const ended: DemoShift = { ...shift, status: 'completed', stage: 'completed', endedAt: now.toISOString() };
  const dueAt = new Date(now.getTime() + HOLD_DAYS * DAY_MS).toISOString();

  update({
    shift: ended,
    extraShifts: [ended, ...world.extraShifts],
    extraIncentives: [
      {
        _id: `demo-inc-${shift._id}`,
        shiftId: shift._id,
        date: shift.date,
        mealSlot: shift.mealSlot.toLowerCase(),
        totalIncentiveAmount: total,
        status: 'holding',
        creditDueAt: dueAt,
        breakdown: {
          ordersDelivered: { count: delivered, earned: ordersEarned },
          kmTraveled: { km, earned: kmEarned },
          attendanceStreak: { days: 3, earned: streakEarned },
          onTimeDelivery: { percentage: delivered > 0 ? 100 : 0, earned: onTimeEarned },
          earlyLogin: { earned: 0 },
        },
      },
      ...world.extraIncentives,
    ],
    extraLedger: [
      {
        _id: `demo-led-${shift._id}`,
        type: 'pending',
        amount: total,
        source: 'incentive',
        sourceId: shift._id,
        description: `${shift.mealSlot} shift incentive`,
        balanceAfter: 0,
        createdAt: now.toISOString(),
        releasesAt: dueAt,
      },
      ...world.extraLedger,
    ],
  });
  return ended;
}

export interface DemoTarget {
  key: string;
  point: LatLng;
}

/** Where the simulated rider should drive next, or null when there is nothing to do right now. */
export function nextTarget(from: LatLng): DemoTarget | null {
  if (world.shift?.status !== 'online') return null;
  const nearest = (candidates: DemoTarget[]): DemoTarget | null =>
    candidates.reduce<DemoTarget | null>(
      (best, candidate) =>
        best === null || haversineMeters(from, candidate.point) < haversineMeters(from, best.point) ? candidate : best,
      null,
    );

  const waiting = world.orders.filter((order) => order.orderstatus === 'preparing' || order.orderstatus === 'readyToDelivery');
  if (waiting.length > 0) {
    const kitchens = new Map<string, DemoTarget>();
    for (const order of waiting) kitchens.set(order.kitchenKey, { key: `kitchen:${order.kitchenKey}`, point: order.kitchenGeolocation });
    return nearest([...kitchens.values()]);
  }
  const onTheWay = world.orders.filter((order) => order.orderstatus === 'onTheWay');
  return nearest(onTheWay.map((order) => ({ key: `customer:${order._id}`, point: order.customerLocation.geolocation })));
}

/** Where the rider stands before the shift: 40 m from the first kitchen, inside the 100 m attendance gate. */
export function startingPoint(): LatLng {
  const first = DEMO_KITCHENS[0]!.location;
  return { lat: first.lat - 0.00036, lng: first.lng };
}
