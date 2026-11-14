import { FONT_FAMILY } from './typography';

/** Font files for `useFonts` in the root layout (kept apart from `typography.ts` so pure code never loads `.ttf`). */
export const appFontMap = {
  [FONT_FAMILY.regular]: require('../assets/fonts/plus-jakarta/PlusJakartaSans-Regular.ttf') as number,
  [FONT_FAMILY.medium]: require('../assets/fonts/plus-jakarta/PlusJakartaSans-Medium.ttf') as number,
  [FONT_FAMILY.semibold]: require('../assets/fonts/plus-jakarta/PlusJakartaSans-SemiBold.ttf') as number,
  [FONT_FAMILY.bold]: require('../assets/fonts/plus-jakarta/PlusJakartaSans-Bold.ttf') as number,
  [FONT_FAMILY.extrabold]: require('../assets/fonts/plus-jakarta/PlusJakartaSans-ExtraBold.ttf') as number,
};
