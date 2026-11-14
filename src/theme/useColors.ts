import { useColorScheme } from 'react-native';

import { getStatusColors, type StatusColors, type StatusTone } from './statusColors';
import { getSemanticColors, type ColorSchemeName, type SemanticColors } from './theme';

/** Current color scheme, collapsed to 'light' | 'dark'. */
export function useScheme(): ColorSchemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** Semantic colors for JS-side styling (inline `style`, SVG, native tabs). */
export function useColors(): SemanticColors {
  return getSemanticColors(useScheme());
}

/** Fill, ink and soft colors for a status tone in the current scheme. */
export function useStatusColors(tone: StatusTone): StatusColors {
  return getStatusColors(tone, useScheme());
}
