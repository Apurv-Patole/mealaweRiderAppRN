import { Appearance } from 'react-native';
import { create } from 'zustand';

import { STORAGE_KEYS } from '@/config/constants';
import { kvStorage } from '@/services/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

function isPreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

/** RN's Appearance uses 'unspecified' (not null) to mean "follow the system". */
function applyPreference(preference: ThemePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

interface ThemeState {
  preference: ThemePreference;
  hydrate: () => void;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',

  hydrate: () => {
    const saved = kvStorage.getString(STORAGE_KEYS.themePreference);
    const preference = isPreference(saved) ? saved : 'system';
    applyPreference(preference);
    set({ preference });
  },

  setPreference: (preference) => {
    kvStorage.set(STORAGE_KEYS.themePreference, preference);
    applyPreference(preference);
    set({ preference });
  },
}));
