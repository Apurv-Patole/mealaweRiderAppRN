import { haversineMeters, type LatLng } from '@/lib/geo';

import type { KitchenStop } from './kitchen';

/**
 * Decides what the Route tab shows and whether attendance can be marked (pure).
 * Rules come from the Ionic app: a slot window must be open, the rider must have a route,
 * the required permissions must be granted, and when orders are assigned the rider must
 * be within `proximityM` of the first kitchen.
 */
export interface GateInput {
  online: boolean;
  routeNo: string | null;
  /** A slot window is open right now. */
  slotOpen: boolean;
  permissionsReady: boolean;
  ordersLoading: boolean;
  /** The kitchen to visit first, or null when there are no orders or none could be located. */
  kitchen: KitchenStop | null;
  riderLocation: LatLng | null;
  proximityM: number;
}

export type Gate =
  | { kind: 'online' }
  | { kind: 'noRoute' }
  | { kind: 'noSlot' }
  | { kind: 'needsPermissions' }
  | { kind: 'loadingOrders' }
  | { kind: 'gettingLocation'; kitchen: KitchenStop }
  | { kind: 'tooFar'; kitchen: KitchenStop; distanceM: number }
  /** Attendance can be marked. `kitchen` is null when there is nothing to check proximity against. */
  | { kind: 'ready'; kitchen: KitchenStop | null; distanceM: number | null };

export function evaluateGate(input: GateInput): Gate {
  if (input.online) return { kind: 'online' };
  if (!input.routeNo) return { kind: 'noRoute' };
  if (!input.slotOpen) return { kind: 'noSlot' };
  if (!input.permissionsReady) return { kind: 'needsPermissions' };
  if (input.ordersLoading) return { kind: 'loadingOrders' };

  const { kitchen, riderLocation, proximityM } = input;
  if (!kitchen) return { kind: 'ready', kitchen: null, distanceM: null };
  if (!riderLocation) return { kind: 'gettingLocation', kitchen };

  const distanceM = haversineMeters(riderLocation, kitchen.location);
  return distanceM <= proximityM
    ? { kind: 'ready', kitchen, distanceM }
    : { kind: 'tooFar', kitchen, distanceM };
}

/** True only for the gate state in which the selfie button may be used. */
export function canMarkAttendance(gate: Gate): boolean {
  return gate.kind === 'ready';
}
