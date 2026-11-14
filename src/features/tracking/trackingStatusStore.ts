import { create } from 'zustand';

/** A problem starting or running location sharing, to show on the Route tab instead of failing silently. */
interface TrackingStatusState {
  error: string | null;
  setError: (error: string | null) => void;
}

export const useTrackingStatusStore = create<TrackingStatusState>((set) => ({
  error: null,
  setError: (error) => set({ error }),
}));
