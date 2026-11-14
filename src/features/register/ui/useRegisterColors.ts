import { useSchemePalette } from '@/theme/useSchemePalette';

import { REGISTER_COLORS, REGISTER_COLORS_DARK, type RegisterColors } from './registerTheme';

/** Registration colours for the current light or dark scheme. */
export function useRegisterColors(): RegisterColors {
  return useSchemePalette<RegisterColors>(REGISTER_COLORS, REGISTER_COLORS_DARK as RegisterColors);
}
