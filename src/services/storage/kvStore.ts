import type { createMMKV as CreateMmkv, MMKV } from 'react-native-mmkv';

/**
 * Fast synchronous key-value storage (MMKV) for non-sensitive app state:
 * theme preference, onboarding flag, cached lists.
 *
 * MMKV v4 is a Nitro native module and is NOT available in Expo Go. It is
 * required lazily so the module loads where the native part is absent; calling
 * a method there throws, so use a development build.
 */
let mmkv: MMKV | null = null;

function store(): MMKV {
  if (!mmkv) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv') as { createMMKV: typeof CreateMmkv };
    mmkv = createMMKV({ id: 'mealawe.rider.kv' });
  }
  return mmkv;
}

export const kvStorage = {
  getString(key: string): string | undefined {
    return store().getString(key);
  },

  getBoolean(key: string): boolean | undefined {
    return store().getBoolean(key);
  },

  set(key: string, value: string | number | boolean): void {
    store().set(key, value);
  },

  getObject<T>(key: string): T | null {
    const raw = store().getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setObject(key: string, value: unknown): void {
    store().set(key, JSON.stringify(value));
  },

  remove(key: string): void {
    store().remove(key);
  },
};
