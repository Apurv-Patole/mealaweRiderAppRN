import { create } from 'zustand';

import { STORAGE_KEYS } from '@/config/constants';
import {
  INITIAL_AUTH_STATE,
  restoreState,
  signedIn,
  signedOut,
  withRider,
  type AuthState,
} from '@/features/auth/authState';
import type { RiderProfile } from '@/features/auth/riderProfile';
import { syncDemoSession } from '@/features/demo/demoSession';
import { kvStorage, secureStorage } from '@/services/storage';

interface AuthActions {
  /** Reads the persisted session. Call once at startup. */
  hydrate: () => Promise<void>;
  setSession: (token: string, rider: RiderProfile | null) => Promise<void>;
  setRider: (rider: RiderProfile | null) => void;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...INITIAL_AUTH_STATE,

  hydrate: async () => {
    const token = await secureStorage.get(STORAGE_KEYS.token);
    const rider = token ? kvStorage.getObject<RiderProfile>(STORAGE_KEYS.rider) : null;
    syncDemoSession(token);
    set(restoreState(token, rider));
  },

  setSession: async (token, rider) => {
    syncDemoSession(token);
    await secureStorage.set(STORAGE_KEYS.token, token);
    if (rider) kvStorage.setObject(STORAGE_KEYS.rider, rider);
    else kvStorage.remove(STORAGE_KEYS.rider);
    set(signedIn(token, rider));
  },

  setRider: (rider) => {
    if (rider) kvStorage.setObject(STORAGE_KEYS.rider, rider);
    else kvStorage.remove(STORAGE_KEYS.rider);
    set(withRider(get(), rider));
  },

  clearSession: async () => {
    syncDemoSession(null);
    await secureStorage.remove(STORAGE_KEYS.token);
    kvStorage.remove(STORAGE_KEYS.rider);
    set(signedOut());
  },
}));
