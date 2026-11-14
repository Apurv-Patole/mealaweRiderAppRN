import { create } from 'zustand';

import { STORAGE_KEYS } from '@/config/constants';
import { kvStorage } from '@/services/storage';

/**
 * Remembers which shift's delivery ride was started from this phone. The server may take a moment to
 * show orders as "on the way", and without this the Start Delivery Ride button would reappear.
 */
interface RideState {
  startedShiftId: string | null;
  hydrate: () => void;
  markStarted: (shiftId: string) => void;
}

export const useRideStore = create<RideState>((set) => ({
  startedShiftId: null,

  hydrate: () => set({ startedShiftId: kvStorage.getString(STORAGE_KEYS.rideStartedShift) ?? null }),

  markStarted: (shiftId) => {
    kvStorage.set(STORAGE_KEYS.rideStartedShift, shiftId);
    set({ startedShiftId: shiftId });
  },
}));
