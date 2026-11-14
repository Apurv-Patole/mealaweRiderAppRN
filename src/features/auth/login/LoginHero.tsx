import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { RiderLogo } from '@/features/onboarding/art/RiderLogo';
import { FONT_FAMILY } from '@/theme';

import { LOGIN_METRICS } from './loginTheme';
import { iconBackSvg, logoMarkSvg, logoWordASvg, logoWordBSvg, pillBoltSvg, scooterSvg } from './svgSources';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

const DARK_LOGO = { mark: logoMarkSvg, wordA: logoWordASvg, wordB: logoWordBSvg } as const;
const MIN_TOP_INSET = 24;

/** A small filled dot. The larger one behind the live dot is the "ping" ring at 75% opacity. */
function Dot({ size, opacity = 1 }: { size: number; opacity?: number }) {
  const C = useLoginColors();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.lime, opacity }} />;
}

/**
 * Dark brand hero: back button and logo, a live "high demand" strip with the per-order bonus pill,
 * the earnings headline and the scooter illustration. The figures are marketing copy from the design,
 * not live data.
 */
export function LoginHero({ onBack }: { onBack: () => void }) {
  const C = useLoginColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: C.heroBg,
        paddingTop: Math.max(insets.top, MIN_TOP_INSET),
        paddingBottom: 39,
        paddingHorizontal: 16,
        borderBottomLeftRadius: LOGIN_METRICS.heroBottomRadius,
        borderBottomRightRadius: LOGIN_METRICS.heroBottomRadius,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, height: 36 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={LOGIN_METRICS.backHitSlop}
          style={{
            width: LOGIN_METRICS.backSize,
            height: LOGIN_METRICS.backSize,
            borderRadius: LOGIN_METRICS.backSize / 2,
            borderWidth: 1,
            borderColor: C.backBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SvgXml xml={iconBackSvg} width={20} height={20} />
        </Pressable>
        <RiderLogo sources={DARK_LOGO} />
      </View>

      <View style={{ marginTop: 29, paddingHorizontal: 0.5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
            <View style={{ width: 10, height: 10 }}>
              <View style={{ position: 'absolute' }}>
                <Dot size={10} opacity={0.75} />
              </View>
              <Dot size={10} />
            </View>
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{ color: C.heroMuted, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16.5, letterSpacing: 0.55, textTransform: 'uppercase' }}>
              High demand active
            </AppText>
          </View>
          <View
            accessible
            accessibilityLabel="Plus 25 rupees per order"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: C.lime,
            }}>
            <SvgXml xml={pillBoltSvg} width={14} height={14} />
            <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18, letterSpacing: -0.3 }}>
              +₹25 / order
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText style={{ color: C.onHero, fontFamily: FONT_FAMILY.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.6 }}>
              Earn up to <AppText style={{ color: C.lime, fontFamily: FONT_FAMILY.extrabold, fontSize: 24, lineHeight: 30, letterSpacing: -0.6 }}>₹1,200</AppText>
              <AppText style={{ color: C.heroMuted, fontFamily: FONT_FAMILY.regular, fontSize: 13, letterSpacing: 0 }}> /shift</AppText>
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 }}>
              <Dot size={6} />
              <AppText variant="caption" style={{ color: C.heroMuted, fontSize: 12, lineHeight: 15, flexShrink: 1 }}>
                32 orders in your hub • Peak hours
              </AppText>
            </View>
          </View>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 96, height: 80 }}>
            <SvgXml xml={scooterSvg} width={96} height={80} />
          </View>
        </View>
      </View>
    </View>
  );
}
