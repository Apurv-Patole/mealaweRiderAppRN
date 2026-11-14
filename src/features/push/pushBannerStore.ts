import { create } from 'zustand';

import type { PushBanner } from './pushReactions';

interface PushBannerState {
  banner: PushBanner | null;
  show: (banner: PushBanner) => void;
  dismiss: () => void;
}

/** The one in-app notice on screen; a newer one replaces the older. */
export const usePushBannerStore = create<PushBannerState>((set) => ({
  banner: null,
  show: (banner) => set({ banner }),
  dismiss: () => set({ banner: null }),
}));
