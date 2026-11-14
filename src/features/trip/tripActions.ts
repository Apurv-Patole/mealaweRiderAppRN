import { STORAGE_KEYS } from '@/config/constants';
import type { RiderProfile } from '@/features/auth';
import { isReadyForPickup } from '@/features/orders/lifecycle';
import type { RiderOrder } from '@/features/orders/orderModel';
import { useOrdersStore } from '@/features/orders/ordersStore';
import type { RouteStop } from '@/features/route/routePlanner';
import type { RiderShift } from '@/features/shift/shiftModel';
import type { LatLng } from '@/lib/geo';
import { kvStorage } from '@/services/storage';

import { createAction, hasActionFor, makeActionId, type ActionKind } from './actionQueue';
import { composeCancelReason } from './cancelReason';
import { useActionQueueStore } from './actionQueueStore';
import {
  createPendingProof,
  isPendingProofUsable,
  parsePendingProof,
  type PendingProof,
} from './proofPending';
import { captureProof, takePendingProof } from './proofCamera';
import { useRideStore } from './rideStore';
import { startDeliveryRide, submitCancelRequest, type CancelRequestInput } from './tripApi';

/** Everything an action needs to know about the rider right now. */
export interface TripContext {
  rider: RiderProfile;
  shift: RiderShift;
  location: LatLng | null;
}

/** Saves the photo-backed actions and starts sending them. Several orders can share one photo. */
function enqueueFromPhoto(pending: PendingProof, photoUri: string): number {
  const now = Date.now();
  const actions = pending.orders.map((order) =>
    createAction(
      {
        id: makeActionId(now),
        kind: pending.kind,
        orderId: order.orderId,
        orderNo: order.orderNo,
        photoUri,
        location: pending.location,
        riderId: pending.riderId,
        shiftId: pending.shiftId,
        handOverTo: pending.handOverTo,
      },
      now,
    ),
  );
  useActionQueueStore.getState().enqueue(actions);
  void useActionQueueStore.getState().process();
  return actions.length;
}

/**
 * Opens the camera for a set of orders. The context is saved first so the actions can still be
 * queued if Android kills the app while the camera is open (see `resumePendingProof`).
 * Returns how many actions were queued (0 if the rider cancelled).
 */
async function photographAndQueue(pending: PendingProof): Promise<number> {
  kvStorage.setObject(STORAGE_KEYS.proofPending, pending);
  try {
    const photoUri = await captureProof();
    return photoUri ? enqueueFromPhoto(pending, photoUri) : 0;
  } finally {
    kvStorage.remove(STORAGE_KEYS.proofPending);
  }
}

/** A delivery photo that has been taken but not yet saved: the rider can review it, retake it or confirm it. */
export interface DeliveryPhoto {
  pending: PendingProof;
  photoUri: string;
}

/**
 * Step one of a delivery: opens the camera and returns the photo for review. Nothing is queued yet.
 * Returns null when the rider cancels the camera or the delivery is already saved.
 */
export async function takeDeliveryPhoto(order: RiderOrder, handOverTo: string, ctx: TripContext): Promise<DeliveryPhoto | null> {
  if (hasActionFor(useActionQueueStore.getState().items, order.id, 'delivery')) return null;
  const pending = createPendingProof(
    {
      kind: 'delivery',
      orders: [{ orderId: order.id, orderNo: order.orderNo }],
      location: ctx.location,
      riderId: ctx.rider.riderId,
      shiftId: ctx.shift.id,
      handOverTo,
    },
    Date.now(),
  );
  kvStorage.setObject(STORAGE_KEYS.proofPending, pending);
  try {
    const photoUri = await captureProof();
    return photoUri ? { pending, photoUri } : null;
  } finally {
    kvStorage.remove(STORAGE_KEYS.proofPending);
  }
}

/** Step two of a delivery: saves the reviewed photo and starts sending it. Returns how many actions were queued. */
export function confirmDeliveryPhoto(photo: DeliveryPhoto): number {
  return enqueueFromPhoto(photo.pending, photo.photoUri);
}

/** Pickup at a kitchen: one photo covers every order still waiting there. */
export async function startPickup(stop: RouteStop, ctx: TripContext): Promise<number> {
  const queued = useActionQueueStore.getState().items;
  // Only orders the kitchen has marked ready can be picked up, and one that is already queued is skipped.
  const orders = stop.orders.filter((order) => isReadyForPickup(order.statusKey) && !hasActionFor(queued, order.id, 'pickup'));
  if (orders.length === 0) return 0;

  return photographAndQueue(
    createPendingProof(
      {
        kind: 'pickup',
        orders: orders.map((order) => ({ orderId: order.id, orderNo: order.orderNo })),
        location: ctx.location,
        riderId: ctx.rider.riderId,
        shiftId: ctx.shift.id,
        handOverTo: '',
      },
      Date.now(),
    ),
  );
}

/** Delivery of one order: photo plus who received it. */
export async function startDelivery(order: RiderOrder, handOverTo: string, ctx: TripContext): Promise<number> {
  if (hasActionFor(useActionQueueStore.getState().items, order.id, 'delivery')) return 0;
  return photographAndQueue(
    createPendingProof(
      {
        kind: 'delivery',
        orders: [{ orderId: order.id, orderNo: order.orderNo }],
        location: ctx.location,
        riderId: ctx.rider.riderId,
        shiftId: ctx.shift.id,
        handOverTo,
      },
      Date.now(),
    ),
  );
}

/**
 * If Android killed the app while the proof camera was open, finish queuing from the photo that is
 * waiting. Returns how many actions were queued.
 */
export async function resumePendingProof(rider: RiderProfile): Promise<number> {
  const pending = parsePendingProof(kvStorage.getObject<unknown>(STORAGE_KEYS.proofPending));
  if (!pending) return 0;
  try {
    if (!isPendingProofUsable(pending, rider.riderId, Date.now())) return 0;
    const photoUri = await takePendingProof();
    return photoUri ? enqueueFromPhoto(pending, photoUri) : 0;
  } finally {
    kvStorage.remove(STORAGE_KEYS.proofPending);
  }
}

/**
 * Starts the delivery ride. Needs the connection (every picked-up order must reach the server as "on
 * the way"), so a failure is thrown for the screen to show. On success the ride is remembered for this shift.
 */
export async function startRide(ctx: TripContext): Promise<void> {
  await startDeliveryRide({
    riderId: ctx.rider.riderId,
    shiftId: ctx.shift.id,
    routeNo: ctx.rider.routeNo ?? '',
    location: ctx.location,
  });
  useRideStore.getState().markStarted(ctx.shift.id);
  await useOrdersStore.getState().refresh(ctx.rider);
}

export async function requestCancel(order: RiderOrder, reason: string, note: string): Promise<void> {
  const input: CancelRequestInput = {
    orderId: order.id,
    orderNo: order.orderNo,
    reason: composeCancelReason(reason, note),
    kitchenName: order.kitchen.name,
    customerName: order.customer.name,
    customerPhoneNo: order.customer.phone,
  };
  await submitCancelRequest(input);
}

export type { ActionKind };
