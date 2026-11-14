import { useSchemePalette } from '@/theme/useSchemePalette';

import { PROFILE_COLORS, PROFILE_COLORS_DARK, type ProfileColors } from './profileTheme';

/** Profile tab colours for the current light or dark scheme. */
export function useProfileColors(): ProfileColors {
  return useSchemePalette<ProfileColors>(PROFILE_COLORS, PROFILE_COLORS_DARK as ProfileColors);
}
