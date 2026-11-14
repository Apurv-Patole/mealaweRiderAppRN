import type { LatLng } from '@/lib/geo';
import { retryDelayMs } from '@/lib/backoff';

/**
 * The rider's pending pickup and delivery updates (pure, no React Native imports).
 *
 * A rider often has no signal at a kitchen basement or a customer's lift. Every action is
 * therefore saved first and sent as a list of STEPS, so a retry resumes where it stopped:
 * a photo that already uploaded is not uploaded again, and a status that already changed is
 * not changed twice.
 *
 *   pickup   : proof photo -> pickup record -> status "picked up"
 *   delivery : proof photo -> status "delivered"
 */
export type ActionKind = 'pickup' | 'delivery';
export type ActionStep = 'proof' | 'complete' | 'status';

const STEPS: Record<ActionKind, readonly ActionStep[]> = {
  pickup: ['proof', 'complete', 'status'],
  delivery: ['proof', 'status'],
};

/** The order status each action leads to. */
export const TARGET_STATUS: Record<ActionKind, 'handedOverToDeliveryBoy' | 'delivered'> = {
  pickup: 'handedOverToDeliveryBoy',
  delivery: 'delivered',
};

export type ActionState = 'pending' | 'failed';

export interface QueuedAction {
  id: string;
  kind: ActionKind;
  orderId: string;
  orderNo: string;
  /** The photo to upload, a local file path. */
  photoUri: string;
  location: LatLng | null;
  riderId: string;
  shiftId: string;
  /** Delivery only: who received the food. */
  handOverTo: string;
  createdAt: number;
  /** Steps already completed, in order. */
  done: ActionStep[];
  /** Filled in by the "proof" step and used by the later steps. */
  proofUrl: string | null;
  attempts: number;
  /** Do not retry before this time (ms since epoch). */
  retryAt: number;
  state: ActionState;
  /** The last problem, in words the rider can read. */
  error: string | null;
}

export interface NewAction {
  id: string;
  kind: ActionKind;
  orderId: string;
  orderNo: string;
  photoUri: string;
  location: LatLng | null;
  riderId: string;
  shiftId: string;
  handOverTo?: string;
}

/** A unique id for a queued action: time plus a random suffix (the random source is injectable for tests). */
export function makeActionId(nowMs: number, random: () => number = Math.random): string {
  return `${nowMs.toString(36)}-${Math.floor(random() * 36 ** 6).toString(36).padStart(6, '0')}`;
}

export function createAction(input: NewAction, nowMs: number): QueuedAction {
  return {
    id: input.id,
    kind: input.kind,
    orderId: input.orderId,
    orderNo: input.orderNo,
    photoUri: input.photoUri,
    location: input.location,
    riderId: input.riderId,
    shiftId: input.shiftId,
    handOverTo: input.handOverTo ?? '',
    createdAt: nowMs,
    done: [],
    proofUrl: null,
    attempts: 0,
    retryAt: nowMs,
    state: 'pending',
    error: null,
  };
}

/** The step to run next, or null when every step is done. */
export function nextStep(action: QueuedAction): ActionStep | null {
  return STEPS[action.kind].find((step) => !action.done.includes(step)) ?? null;
}

export function isComplete(action: QueuedAction): boolean {
  return nextStep(action) === null;
}

/** Records a finished step (and the proof URL when the step produced one). */
export function completeStep(action: QueuedAction, step: ActionStep, proofUrl?: string): QueuedAction {
  if (action.done.includes(step)) return action;
  return {
    ...action,
    done: [...action.done, step],
    proofUrl: proofUrl ?? action.proofUrl,
    attempts: 0,
    error: null,
  };
}

/**
 * Whether a failed request is worth trying again. Connection problems, timeouts, rate limits and
 * server errors are retried. A refusal that will not change (the order was cancelled, is already
 * delivered, or no longer exists) is not.
 */
export function isRetryableFailure(status: number): boolean {
  if (status === 0) return true; // no connection or timed out
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

/** A retryable failure: keep the action, remember the problem, and wait before the next try. */
export function recordRetry(action: QueuedAction, message: string, nowMs: number): QueuedAction {
  const attempts = action.attempts + 1;
  return { ...action, attempts, error: message, retryAt: nowMs + retryDelayMs(attempts - 1) };
}

/** A failure that will not fix itself: stop retrying and show the rider why. */
export function recordFailure(action: QueuedAction, message: string): QueuedAction {
  return { ...action, state: 'failed', error: message };
}

/** Actions that are ready to send now, oldest first. */
export function dueActions(actions: readonly QueuedAction[], nowMs: number): QueuedAction[] {
  return actions
    .filter((action) => action.state === 'pending' && action.retryAt <= nowMs)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function pendingActions(actions: readonly QueuedAction[]): QueuedAction[] {
  return actions.filter((action) => action.state === 'pending');
}

export function failedActions(actions: readonly QueuedAction[]): QueuedAction[] {
  return actions.filter((action) => action.state === 'failed');
}

/** True when this order already has an unfinished action of the same kind (blocks a double tap). */
export function hasActionFor(actions: readonly QueuedAction[], orderId: string, kind: ActionKind): boolean {
  return actions.some((action) => action.orderId === orderId && action.kind === kind && action.state === 'pending');
}

/** Puts a failed action back in line (the rider tapped "Try again"). */
export function retryNow(action: QueuedAction, nowMs: number): QueuedAction {
  return { ...action, state: 'pending', attempts: 0, error: null, retryAt: nowMs };
}

/** Narrows stored JSON to a queue, dropping anything malformed. */
export function parseQueue(raw: unknown): QueuedAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is QueuedAction => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Record<string, unknown>;
    return (
      typeof record.id === 'string' &&
      (record.kind === 'pickup' || record.kind === 'delivery') &&
      typeof record.orderId === 'string' &&
      typeof record.photoUri === 'string' &&
      Array.isArray(record.done) &&
      (record.state === 'pending' || record.state === 'failed')
    );
  });
}

/** The minimal order fields this overlay changes. */
export interface OverlayOrder {
  id: string;
  statusKey: string;
  lifecycle: 'prePickup' | 'postPickup' | 'done' | 'cancelled' | 'unknown';
}

const TARGET_LIFECYCLE = { pickup: 'postPickup', delivery: 'done' } as const;
const TARGET_KEY = { pickup: 'handedovertodeliveryboy', delivery: 'delivered' } as const;

/**
 * Shows orders as the rider has already left them: an order with a waiting pickup or delivery
 * appears picked up or delivered right away, instead of snapping back to its old status until
 * the update reaches the server. Never touches an order the server already moved on or cancelled.
 */
export function applyPending<T extends OverlayOrder>(orders: readonly T[], actions: readonly QueuedAction[]): T[] {
  const waiting = pendingActions(actions);
  if (waiting.length === 0) return [...orders];
  return orders.map((order) => {
    if (order.lifecycle === 'cancelled' || order.lifecycle === 'done') return order;
    const mine = waiting.filter((action) => action.orderId === order.id);
    // The furthest-along waiting action wins (a delivery beats a pickup).
    const best = mine.find((action) => action.kind === 'delivery') ?? mine[0];
    if (!best) return order;
    return { ...order, statusKey: TARGET_KEY[best.kind], lifecycle: TARGET_LIFECYCLE[best.kind] };
  });
}
