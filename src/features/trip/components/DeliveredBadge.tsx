import { View } from 'react-native';
import { SvgXml as RawSvg } from 'react-native-svg';

import { SvgXml } from '@/components/ThemedSvg';
import { useScheme } from '@/theme';

import { DELIVERED_BADGE, DELIVERED_BADGE_DARK } from '../deliveredTheme';
import { heroCheckSvg } from '../ui/deliveredSvgSources';

const SIZE = 128;

/** The four corners of the outer rounded square, faded out towards the middle of each side (a mask in the design). */
function cornersXml(stroke: string): string {
  return `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="fade" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) scale(84.8528)">
<stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
<stop offset="0.75" stop-color="#fff"/>
</radialGradient>
<mask id="corners"><rect width="120" height="120" fill="url(#fade)"/></mask>
</defs>
<rect x="1" y="1" width="118" height="118" rx="27" stroke="${stroke}" stroke-width="2" mask="url(#corners)"/>
</svg>`;
}

/** The "Delivered" hero: a green tick on soft mint rings inside a rounded square, with a lime dot. */
export function DeliveredBadge() {
  const dark = useScheme() === 'dark';
  const c = dark ? DELIVERED_BADGE_DARK : DELIVERED_BADGE;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 4, left: 4 }}>
        <RawSvg xml={cornersXml(c.corners)} width={120} height={120} />
      </View>
      <View style={{ position: 'absolute', top: 16, left: 16, width: 96, height: 96, borderRadius: 48, backgroundColor: c.ringOuter }} />
      <View style={{ position: 'absolute', top: 24, left: 24, width: 80, height: 80, borderRadius: 40, backgroundColor: c.ringInner }} />
      <View style={{ position: 'absolute', top: 8, right: 24, width: 12, height: 12, borderRadius: 6, backgroundColor: c.dot }} />
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.core,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: c.core,
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <SvgXml xml={heroCheckSvg} width={28} height={28} raw />
      </View>
    </View>
  );
}
