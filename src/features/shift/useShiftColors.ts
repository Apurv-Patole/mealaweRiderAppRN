import { useSchemePalette } from '@/theme/useSchemePalette';

import { SHIFT_COLORS, SHIFT_COLORS_DARK, type ShiftColors } from './shiftTheme';

/** Route tab colours for the current light or dark scheme. */
export function useShiftColors(): ShiftColors {
  return useSchemePalette<ShiftColors>(SHIFT_COLORS, SHIFT_COLORS_DARK as ShiftColors);
}
