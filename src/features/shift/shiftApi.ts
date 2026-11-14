import { appendPart } from '@/lib/formParts';
import { ENDPOINTS, http } from '@/services/http';

import { buildEndShiftFormData, buildShiftFormData, type EndShiftInput, type StartShiftInput } from './shiftForm';
import { normalizeShift, statusByMeal, type RiderShift } from './shiftModel';
import { buildSlots, type SlotWindow } from './slots';

/** Slot windows for the rider's city (resolved by the server from the login token). Falls back to defaults. */
export async function fetchSlotConfig(): Promise<SlotWindow[]> {
  try {
    return buildSlots(await http.get<unknown>(ENDPOINTS.shift.slotConfig));
  } catch {
    return buildSlots(null);
  }
}

/**
 * The rider's active shift for a meal slot, or null when there is none. Network errors
 * THROW on purpose: an error must never be mistaken for "no shift", which would wrongly
 * show the attendance prompt to a rider who is already online.
 */
export async function fetchTodayShift(riderId: string, mealSlot: string, routeNo: string): Promise<RiderShift | null> {
  const params = new URLSearchParams({ mealSlot });
  if (routeNo) params.set('routeNo', routeNo);
  const raw = await http.get<unknown>(`${ENDPOINTS.shift.today}/${encodeURIComponent(riderId)}?${params.toString()}`);
  return normalizeShift(raw);
}

/** Every shift the rider has today, as meal slot to status, for the slot timetable. */
export async function fetchTodayStatuses(riderId: string) {
  return statusByMeal(await http.get<unknown>(`${ENDPOINTS.shift.todayAll}/${encodeURIComponent(riderId)}`));
}

/** Starts the shift (attendance). The server is idempotent per rider, date and slot. */
export async function startShift(input: StartShiftInput): Promise<RiderShift> {
  const form = new FormData();
  buildShiftFormData(input, { append: (name, value) => appendPart(form, name, value) });
  const shift = normalizeShift(await http.post<unknown>(ENDPOINTS.shift.start, form));
  if (!shift) throw new Error('The server did not return your shift. Please try again.');
  return shift;
}

/**
 * Ends the shift and returns it as the server now has it (with its end time and distance), or null if the
 * reply has no shift. Throws if the server could not end it, so the app never shows "offline" while the
 * server says "online".
 */
export async function endShift(input: EndShiftInput): Promise<RiderShift | null> {
  const form = new FormData();
  buildEndShiftFormData(input, { append: (name, value) => appendPart(form, name, value) });
  return normalizeShift(await http.post<unknown>(ENDPOINTS.shift.end, form));
}

export interface SlotOrdersQuery {
  routeNo: string;
  mealType: string;
  clusterIds: string[];
}

/** Today's orders for the rider's route and slot (used to find the first kitchen). */
export async function fetchSlotOrders(query: SlotOrdersQuery): Promise<unknown[]> {
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);

  const result = await http.post<unknown>(ENDPOINTS.orders.search, {
    routeNo: query.routeNo,
    mealType: query.mealType,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    clusterList: query.clusterIds,
  });
  return Array.isArray(result) ? result : [];
}
