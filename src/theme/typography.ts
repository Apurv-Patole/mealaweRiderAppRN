import type { TextStyle } from 'react-native';

import type { TextVariant } from '@/components/ui/textA11y';

/**
 * Plus Jakarta Sans, the typeface in the Figma designs. React Native does not synthesize
 * weights reliably, so each weight is its own family: pick the family, never `fontWeight`.
 */
export const FONT_FAMILY = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

export type FontWeightName = keyof typeof FONT_FAMILY;

type Preset = Required<Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontFamily'>> &
  Pick<TextStyle, 'letterSpacing'>;

/** 14 px is the smallest body text: riders read this outdoors, in sunlight. Line height is about 150%. */
export const typography: Record<TextVariant, Preset> = {
  display: { fontSize: 28, lineHeight: 36, fontFamily: FONT_FAMILY.bold, letterSpacing: -0.5 },
  h1: { fontSize: 24, lineHeight: 32, fontFamily: FONT_FAMILY.bold, letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 28, fontFamily: FONT_FAMILY.bold, letterSpacing: -0.3 },
  title: { fontSize: 17, lineHeight: 24, fontFamily: FONT_FAMILY.bold, letterSpacing: -0.1 },
  button: { fontSize: 16, lineHeight: 22, fontFamily: FONT_FAMILY.bold, letterSpacing: 0 },
  body: { fontSize: 14, lineHeight: 21, fontFamily: FONT_FAMILY.regular, letterSpacing: 0 },
  label: { fontSize: 14, lineHeight: 20, fontFamily: FONT_FAMILY.semibold, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 17, fontFamily: FONT_FAMILY.regular, letterSpacing: 0.1 },
  overline: { fontSize: 11, lineHeight: 15, fontFamily: FONT_FAMILY.semibold, letterSpacing: 1 },
};
