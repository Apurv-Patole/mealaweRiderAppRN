import type { ViewStyle } from 'react-native';

/**
 * Soft elevation so cards lift off the page on light backgrounds. On dark backgrounds depth comes from
 * the surface-versus-page contrast instead, so shadows are skipped there.
 */
export const shadow: Record<'card' | 'lifted', ViewStyle> = {
  card: {
    shadowColor: '#0b1220',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lifted: {
    shadowColor: '#0b1220',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};
