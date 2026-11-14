import { create } from 'zustand';

import { STORAGE_KEYS } from '@/config/constants';
import { kvStorage } from '@/services/storage';

/** One-time flags that survive restarts: onboarding seen, permissions wizard shown. */
interface AppFlagsState {
  onboardingDone: boolean;
  permissionsPrompted: boolean;
  hydrate: () => void;
  completeOnboarding: () => void;
  /** Shows the welcome screens again this session only; the saved flag stays set so the next launch skips them. */
  replayOnboarding: () => void;
  markPermissionsPrompted: () => void;
}

export const useAppFlagsStore = create<AppFlagsState>((set) => ({
  onboardingDone: false,
  permissionsPrompted: false,

  hydrate: () =>
    set({
      onboardingDone: kvStorage.getBoolean(STORAGE_KEYS.onboardingDone) === true,
      permissionsPrompted: kvStorage.getBoolean(STORAGE_KEYS.permissionsPrompted) === true,
    }),

  completeOnboarding: () => {
    kvStorage.set(STORAGE_KEYS.onboardingDone, true);
    set({ onboardingDone: true });
  },

  replayOnboarding: () => set({ onboardingDone: false }),

  markPermissionsPrompted: () => {
    kvStorage.set(STORAGE_KEYS.permissionsPrompted, true);
    set({ permissionsPrompted: true });
  },
}));
