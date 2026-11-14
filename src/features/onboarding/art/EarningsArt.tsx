import { View, type ViewStyle } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { CAPSULE, COIN, COIN_LOWER, COIN_UPPER, EARNINGS_BAR, EARNINGS_BARS, EARNINGS_CARD, EARNINGS_RINGS, TAG_LOWER, TAG_UPPER } from './heroLayout';
import { SvgAsset } from './HeroStage';
import { iconBriefcaseSvg, ringInnerSvg, ringMiddleSvg, ringOuterSvg } from './svgSourcesEarnings';
import { useOnboardingColors } from '@/features/onboarding/useOnboardingColors';

const TAG_SHADOW = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/** Slide 3 backdrop: three thin concentric rings radiating from the wallet card. */
export function EarningsBackdrop() {
  return (
    <>
      <SvgAsset xml={ringOuterSvg} rect={EARNINGS_RINGS.outer} />
      <SvgAsset xml={ringMiddleSvg} rect={EARNINGS_RINGS.middle} />
      <SvgAsset xml={ringInnerSvg} rect={EARNINGS_RINGS.inner} />
    </>
  );
}

function Coin({ position }: { position: ViewStyle }) {
  const C = useOnboardingColors();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          position: 'absolute',
          width: COIN.size,
          height: COIN.size,
          borderRadius: COIN.size / 2,
          backgroundColor: C.green,
          alignItems: 'center',
          justifyContent: 'center',
        },
        position,
      ]}>
      <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 28 }}>₹</AppText>
    </View>
  );
}

function AmountTag({ label, position }: { label: string; position: ViewStyle }) {
  const C = useOnboardingColors();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        { position: 'absolute', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999, backgroundColor: C.liveBadgeGlass },
        TAG_SHADOW,
        position,
      ]}>
      <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </View>
  );
}

/** Slide 3 hero: wallet balance card with a six-bar chart, two coin badges, two amount tags and a salary capsule. */
export function EarningsHero() {
  const C = useOnboardingColors();
  return (
    <>
      <Coin position={{ left: COIN_UPPER.left, top: COIN_UPPER.top }} />
      <AmountTag label="+₹285" position={{ right: TAG_UPPER.right, top: TAG_UPPER.top }} />

      <View
        accessible
        accessibilityLabel="Wallet balance ₹1,240"
        style={{
          position: 'absolute',
          left: EARNINGS_CARD.left,
          top: EARNINGS_CARD.top,
          width: EARNINGS_CARD.width,
          padding: 20,
          gap: 4,
          borderRadius: EARNINGS_CARD.radius,
          borderWidth: 1,
          borderColor: C.pillBorder,
          backgroundColor: C.sheet,
          shadowColor: C.green,
          shadowOpacity: 0.08,
          shadowRadius: 25,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        }}>
        <AppText variant="caption" style={{ color: C.muted, fontFamily: FONT_FAMILY.semibold, fontSize: 13, lineHeight: 19.5 }}>
          Wallet balance
        </AppText>
        <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 32, lineHeight: 32, letterSpacing: -0.8 }}>
          ₹1,240
        </AppText>
        <View
          style={{
            height: EARNINGS_CARD.chartHeight,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
          }}>
          {EARNINGS_BARS.map((barHeight, i) => (
            <View
              key={`${barHeight}-${i}`}
              style={{
                width: EARNINGS_BAR.width,
                height: barHeight,
                borderRadius: EARNINGS_BAR.radius,
                backgroundColor: i === EARNINGS_BARS.length - 1 ? C.limeHalo : C.green,
              }}
            />
          ))}
        </View>
      </View>

      <AmountTag label="+₹310" position={{ left: TAG_LOWER.left, bottom: TAG_LOWER.gapAboveSheet }} />

      <View
        accessible
        accessibilityLabel="Salary and incentives"
        style={[
          {
            position: 'absolute',
            left: CAPSULE.left,
            top: CAPSULE.top,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: C.liveBadgeGlass,
          },
          TAG_SHADOW,
        ]}>
        <SvgXml xml={iconBriefcaseSvg} width={14} height={14} />
        <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16.5 }}>
          Salary and incentives
        </AppText>
      </View>

      <Coin position={{ right: COIN_LOWER.right, bottom: COIN_LOWER.gapAboveSheet }} />
    </>
  );
}
