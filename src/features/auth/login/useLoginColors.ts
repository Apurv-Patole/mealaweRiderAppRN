import { useSchemePalette } from '@/theme/useSchemePalette';

import { LOGIN_COLORS, LOGIN_COLORS_DARK, type LoginColors } from './loginTheme';

/** Login colours for the current light or dark scheme. */
export function useLoginColors(): LoginColors {
  return useSchemePalette<LoginColors>(LOGIN_COLORS, LOGIN_COLORS_DARK as LoginColors);
}
