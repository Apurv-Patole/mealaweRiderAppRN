import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { chevronMutedSvg, chevronWhiteSvg } from './homeSvgSources';

/** The design's small "go" chevron: a 16 pt box with the 5.8 x 9.2 stroke placed at its Figma offset. */
export function Chevron({ onDark = false }: { onDark?: boolean }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 16, height: 16 }}>
      <View style={{ position: 'absolute', left: 5.41, top: 3.41, width: 5.77, height: 9.18 }}>
        <SvgXml xml={onDark ? chevronWhiteSvg : chevronMutedSvg} width={5.77} height={9.18} />
      </View>
    </View>
  );
}
