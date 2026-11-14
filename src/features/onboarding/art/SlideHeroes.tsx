import { View } from 'react-native';

import { FloatingPill } from './FloatingPill';
import { AVATAR_CARD, PILL_BONUS, PILL_ON_TIME } from './heroLayout';
import { SvgAsset } from './HeroStage';
import { ShiftDial } from './ShiftDial';
import { iconBoltSvg, iconCheckSvg, iconClockSvg, riderSilhouetteSvg } from './svgSources';
import { useOnboardingColors } from '@/features/onboarding/useOnboardingColors';

const BADGE = 24;

/** Slide 1 hero (Figma node 2003:3): the shift dial, the rider card with a verified badge and two floating pills. */
export function ShiftHero() {
  const C = useOnboardingColors();
  return (
    <>
      <FloatingPill
        iconXml={iconClockSvg}
        iconSize={16}
        label="On time"
        fontSize={13}
        paddingHorizontal={13}
        position={{ left: PILL_ON_TIME.left, top: PILL_ON_TIME.top }}
      />
      <ShiftDial />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: AVATAR_CARD.left,
          top: AVATAR_CARD.top,
          width: AVATAR_CARD.size,
          height: AVATAR_CARD.size,
          borderRadius: 26,
          backgroundColor: C.sheet,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.green,
          shadowOpacity: 0.12,
          shadowRadius: 25,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        }}>
        <View style={{ width: 48, height: 48 }}>
          <SvgAsset xml={riderSilhouetteSvg} rect={{ left: 0, top: 0, width: 48, height: 48 }} />
        </View>
        <View
          style={{
            position: 'absolute',
            right: -4,
            bottom: -4,
            width: BADGE,
            height: BADGE,
            borderRadius: BADGE / 2,
            borderWidth: 2,
            borderColor: C.sheet,
            backgroundColor: C.lime,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ width: 14, height: 14 }}>
            <SvgAsset xml={iconCheckSvg} rect={{ left: 0, top: 0, width: 14, height: 14 }} />
          </View>
        </View>
      </View>
      <FloatingPill
        iconXml={iconBoltSvg}
        iconSize={14}
        label="Early login bonus"
        fontSize={12.5}
        paddingHorizontal={15}
        position={{ right: PILL_BONUS.right, bottom: PILL_BONUS.gapAboveSheet }}
      />
    </>
  );
}
