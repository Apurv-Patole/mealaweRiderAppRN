import { create } from 'zustand';

import type { RiderProfile } from '@/features/auth';

import type { OdometerResult } from './odometerBridge';
import { endShift, fetchSlotConfig, fetchTodayShift, fetchTodayStatuses } from './shiftApi';
import { isShiftOnline, withStatus, type RiderShift, type TodayStatuses } from './shiftModel';
import { attendanceSlot, buildSlots, type SlotWindow } from './slots';

interface ShiftState {
  slots: SlotWindow[];
  shift: RiderShift | null;
  todayStatuses: TodayStatuses;
  /** True until the first load finishes, so screens do not flash the attendance prompt. */
  loading: boolean;
  /** Set when the last refresh failed. The previous shift and slots are kept (see `refresh`). */
  refreshFailed: boolean;
  /** Loads slot windows, today's shift and today's statuses. */
  refresh: (rider: RiderProfile) => Promise<void>;
  /** Stores a shift the server just returned (after attendance). */
  setStarted: (shift: RiderShift) => void;
  /** The shift that was just ended, for the summary screen. Cleared when the rider has seen it. */
  lastEnded: RiderShift | null;
  clearLastEnded: () => void;
  /** Ends the shift on the server first (with the end odometer reading), then clears it locally. Throws if the server call fails. */
  end: (odometer: OdometerResult) => Promise<void>;
  reset: () => void;
}

const INITIAL = {
  slots: buildSlots(null),
  shift: null,
  todayStatuses: {} as TodayStatuses,
  lastEnded: null as RiderShift | null,
  loading: true,
  refreshFailed: false,
};

export const useShiftStore = create<ShiftState>((set, get) => ({
  ...INITIAL,

  refresh: async (rider) => {
    const slots = await fetchSlotConfig();
    // Look up the slot the rider is already working, so a rider still delivering lunch after
    // the dinner window opens is not shown a new dinner attendance prompt.
    const current = get().shift;
    const mealSlot = isShiftOnline(current) ? current.mealSlot : attendanceSlot(slots, new Date()).meal;

    try {
      const [shift, todayStatuses] = await Promise.all([
        fetchTodayShift(rider.riderId, mealSlot, rider.routeNo ?? ''),
        fetchTodayStatuses(rider.riderId),
      ]);
      set({ slots, shift, todayStatuses, loading: false, refreshFailed: false });
    } catch {
      // A failed request must not look like "no shift": keep what we had.
      set({ slots, loading: false, refreshFailed: true });
    }
  },

  setStarted: (shift) =>
    set((state) => ({
      shift,
      refreshFailed: false,
      todayStatuses: withStatus(state.todayStatuses, shift.mealSlot, shift.status),
    })),

  end: async (odometer) => {
    const { shift } = get();
    if (!shift) return;
    const ended = await endShift({ shiftId: shift.id, endKm: odometer.km, odometerPhoto: odometer.photo });
    set((state) => ({
      shift: null,
      lastEnded: ended ?? { ...shift, status: 'completed', endedAt: new Date().toISOString() },
      todayStatuses: withStatus(state.todayStatuses, shift.mealSlot, 'completed'),
    }));
  },

  clearLastEnded: () => set({ lastEnded: null }),

  reset: () => set(INITIAL),
}));
