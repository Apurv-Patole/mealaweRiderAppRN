import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { FRAME, HERO_HEIGHT, type Rect } from './heroLayout';

export interface HeroMetrics {
  scale: number;
  /** Left and top of the scaled design frame on screen. */
  left: number;
  top: number;
}

/** Lays children out in Figma design points (390 x 520) and scales the whole frame to fit the screen. */
export function HeroStage({ metrics, children }: { metrics: HeroMetrics; children: ReactNode }) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: metrics.left,
        top: metrics.top,
        width: FRAME.width,
        height: HERO_HEIGHT,
        transformOrigin: 'top left',
        transform: [{ scale: metrics.scale }],
      }}>
      {children}
    </View>
  );
}

/** An exported Figma SVG at its exact design rect. Decorative, so hidden from screen readers. `roads` is for map layers. */
export function SvgAsset({ xml, rect, roads = false }: { xml: string; rect: Rect; roads?: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
      <SvgXml xml={xml} roads={roads} width={rect.width} height={rect.height} />
    </View>
  );
}
