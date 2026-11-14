import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { logoWordASvg as whiteWordASvg, logoWordBSvg as whiteWordBSvg } from '@/features/auth/login/svgSources';
import { useScheme } from '@/theme';

import { LOGO } from './heroLayout';
import { logoMarkSvg, logoWordASvg, logoWordBSvg } from './svgSources';

export interface RiderLogoSources {
  mark: string;
  wordA: string;
  wordB: string;
}

/** The dark-wordmark logo, for light backgrounds. */
const LIGHT_SOURCES: RiderLogoSources = { mark: logoMarkSvg, wordA: logoWordASvg, wordB: logoWordBSvg };
/** The same logo with the white wordmark, for dark surfaces. */
const DARK_SOURCES: RiderLogoSources = { mark: logoMarkSvg, wordA: whiteWordASvg, wordB: whiteWordBSvg };

/** Percent insets from the Figma logo frame (98 x 36): the scooter mark plus the two-line wordmark. */
const PARTS = [
  { key: 'wordA', left: '40.12%', top: '66.43%', width: '31.59%', height: '24.19%' },
  { key: 'wordB', left: '40.21%', top: '36.64%', width: '59.79%', height: '23.28%' },
  { key: 'mark', left: '0%', top: '0%', width: '35.12%', height: '100%' },
] as const;

/**
 * The "Mealawe Rider" logo lockup from the design. It picks the white wordmark in dark mode; a screen on an
 * always-dark surface (the login hero) passes `sources` itself. The artwork is never recoloured.
 */
export function RiderLogo({ sources }: { sources?: RiderLogoSources }) {
  const scheme = useScheme();
  const chosen = sources ?? (scheme === 'dark' ? DARK_SOURCES : LIGHT_SOURCES);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mealawe Rider logo"
      style={{ width: LOGO.width, height: LOGO.height }}>
      {PARTS.map((part) => (
        <View
          key={part.key}
          style={{ position: 'absolute', left: part.left, top: part.top, width: part.width, height: part.height }}>
          <SvgXml raw xml={chosen[part.key]} width="100%" height="100%" />
        </View>
      ))}
    </View>
  );
}
