import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { env } from '@/config';
import { usePermissions } from '@/features/permissions/usePermissions';
import { PickerPermissionError } from '@/features/register/documentPicker';
import { useNow } from '@/hooks/useNow';
import { HttpError } from '@/services/http';
import { useAuthStore } from '@/store';

import { markAttendance } from './attendanceFlow';
import { evaluateGate, type Gate } from './attendanceGate';
import { requestOdometer } from './odometerBridge';
import { isShiftOnline } from './shiftModel';
import { useShiftStore } from './shiftStore';
import { activeSlot, attendanceSlot, nextSlotOpening, slotStates, type SlotRow, type SlotWindow } from './slots';
import { useCurrentLocation } from './useCurrentLocation';
import { useSlotKitchen } from './useSlotKitchen';

/** How often the slot window is re-checked, so the screen changes when a slot opens or closes. */
const CLOCK_TICK_MS = 30_000;
/**
 * While online, re-check the shift this often. The server ends a shift on its own when the
 * slot window closes (the "auto-end" job), and the app must notice instead of showing "online".
 */
const ONLINE_RECHECK_MS = 5 * 60_000;

function messageFor(error: unknown): string {
  if (error instanceof PickerPermissionError || error instanceof HttpError || error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export interface ShiftScreen {
  now: Date;
  loading: boolean;
  refreshing: boolean;
  /** The last check of the shift failed; what is shown may be out of date. */
  refreshFailed: boolean;
  gate: Gate;
  shiftSlotLabel: string | null;
  startedAt: string | null;
  currentSlot: SlotWindow;
  nextOpening: SlotWindow | null;
  timetable: SlotRow[];
  /** Busy while attendance or End Shift is in progress. */
  busy: boolean;
  error: string | null;
  proximityM: number;
  takeAttendance: () => Promise<void>;
  endShift: () => Promise<void>;
  reload: () => Promise<void>;
}

/** All the state and actions behind the Route tab's shift panel. */
export function useShiftScreen(): ShiftScreen {
  const rider = useAuthStore((state) => state.rider);
  const riderId = rider?.riderId;
  const { slots, shift, todayStatuses, loading, refreshFailed } = useShiftStore();
  const permissions = usePermissions();

  const now = new Date(useNow(CLOCK_TICK_MS));
  const online = isShiftOnline(shift);
  const open = activeSlot(slots, now);
  const currentSlot = attendanceSlot(slots, now);
  const gateRelevant = !online && open !== null;

  const { location } = useCurrentLocation(gateRelevant && permissions.statuses.location === 'granted');
  const kitchen = useSlotKitchen({ enabled: gateRelevant, rider, mealSlot: open?.meal ?? null, riderLocation: location });

  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gate = evaluateGate({
    online,
    routeNo: rider?.routeNo ?? null,
    slotOpen: open !== null,
    permissionsReady: permissions.ready,
    ordersLoading: kitchen.loading,
    kitchen: kitchen.summary.first,
    riderLocation: location,
    proximityM: env.kitchenProximityMeters,
  });

  // Load the shift when the tab opens and whenever the app returns to the foreground.
  useEffect(() => {
    if (!riderId) return;
    const refreshNow = async () => {
      const current = useAuthStore.getState().rider;
      if (current) await useShiftStore.getState().refresh(current);
    };

    void refreshNow();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNow();
    });
    return () => subscription.remove();
  }, [riderId]);

  useEffect(() => {
    if (!riderId || !online) return;
    const timer = setInterval(() => {
      const current = useAuthStore.getState().rider;
      if (current) void useShiftStore.getState().refresh(current);
    }, ONLINE_RECHECK_MS);
    return () => clearInterval(timer);
  }, [riderId, online]);

  const takeAttendance = useCallback(async () => {
    const current = useAuthStore.getState().rider;
    const slot = activeSlot(useShiftStore.getState().slots, new Date());
    if (!current || !slot) return;
    setBusy(true);
    setError(null);
    try {
      await markAttendance(current, slot.meal);
    } catch (caught: unknown) {
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }, []);

  const endShift = useCallback(async () => {
    setError(null);
    // The shift cannot end without the end odometer reading and its photo.
    const odometer = await requestOdometer({ mode: 'end', startKm: useShiftStore.getState().shift?.startOdometerKm ?? null });
    if (!odometer) return;
    setBusy(true);
    try {
      await useShiftStore.getState().end(odometer);
    } catch (caught: unknown) {
      setError(`Could not end your shift: ${messageFor(caught)}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const reload = useCallback(async () => {
    const current = useAuthStore.getState().rider;
    if (!current) return;
    setRefreshing(true);
    setError(null);
    kitchen.reload();
    await Promise.all([useShiftStore.getState().refresh(current), permissions.refresh()]);
    setRefreshing(false);
    // `kitchen.reload` and `permissions.refresh` are stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchen.reload, permissions.refresh]);

  return {
    now,
    loading,
    refreshing,
    refreshFailed,
    gate,
    shiftSlotLabel: shift?.mealSlot ?? null,
    startedAt: shift?.startedAt ?? null,
    currentSlot,
    nextOpening: nextSlotOpening(slots, now),
    timetable: slotStates(slots, now, todayStatuses),
    busy,
    error,
    proximityM: env.kitchenProximityMeters,
    takeAttendance,
    endShift,
    reload,
  };
}
