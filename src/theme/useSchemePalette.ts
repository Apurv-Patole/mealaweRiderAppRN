import { useScheme } from './useColors';

/** Picks the light or the dark twin of a palette for the current colour scheme. */
export function useSchemePalette<T>(light: T, dark: T): T {
  return useScheme() === 'dark' ? dark : light;
}
