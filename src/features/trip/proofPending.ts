import type { LatLng } from '@/lib/geo';

import type { ActionKind } from './actionQueue';

/**
 * Recovery of a pickup or delivery photo when Android kills the app while the camera is open
 * (Realme, OPPO, Xiaomi). Before the camera opens we save what the action needs; if the app restarts
 * with a photo waiting, the actions are queued from that context. Pure: the clock is passed in.
 */
export interface PendingProof {
  kind: ActionKind;
  /** One photo can cover several orders (a pickup at one kitchen). */
  orders: { orderId: string; orderNo: string }[];
  location: LatLng | null;
  riderId: string;
  shiftId: string;
  handOverTo: string;
  savedAt: number;
}

/** A pending photo older than this is ignored: the rider has surely moved on. */
export const PENDING_PROOF_MAX_AGE_MS = 15 * 60 * 1000;

export function createPendingProof(input: Omit<PendingProof, 'savedAt'>, nowMs: number): PendingProof {
  return { ...input, savedAt: nowMs };
}

/** Narrows stored JSON to a `PendingProof`, or null when it is missing or malformed. */
export function parsePendingProof(raw: unknown): PendingProof | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (record.kind !== 'pickup' && record.kind !== 'delivery') return null;
  if (typeof record.riderId !== 'string' || !record.riderId) return null;
  if (typeof record.shiftId !== 'string' || !record.shiftId) return null;
  if (typeof record.savedAt !== 'number' || !Number.isFinite(record.savedAt)) return null;
  if (!Array.isArray(record.orders) || record.orders.length === 0) return null;

  const orders = record.orders.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const { orderId, orderNo } = entry as Record<string, unknown>;
    return typeof orderId === 'string' && orderId ? [{ orderId, orderNo: typeof orderNo === 'string' ? orderNo : orderId }] : [];
  });
  if (orders.length === 0) return null;

  const location = record.location as Record<string, unknown> | null | undefined;
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return {
    kind: record.kind,
    orders,
    location: location && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    riderId: record.riderId,
    shiftId: record.shiftId,
    handOverTo: typeof record.handOverTo === 'string' ? record.handOverTo : '',
    savedAt: record.savedAt,
  };
}

export function isPendingProofUsable(pending: PendingProof, riderId: string, nowMs: number): boolean {
  const age = nowMs - pending.savedAt;
  return pending.riderId === riderId && age >= 0 && age <= PENDING_PROOF_MAX_AGE_MS;
}
