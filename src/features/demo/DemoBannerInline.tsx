import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { HOME_METRICS } from '@/features/orders/home/homeTheme';
import { bannerDemoSvg } from '@/features/orders/home/homeSvgSources';
import { useAuthStore } from '@/store';
import { FONT_FAMILY } from '@/theme';

import { confirmExitDemo, confirmRestartDemo } from './demoActions';
import { isDemoToken } from './demoSession';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

const ACTION_HIT_SLOP = 12;

/** The pale-blue demo strip at the top of Home: says the data is simulated, with Restart and Exit. */
export function DemoBannerInline() {
  const C = useHomeColors();
  const demo = useAuthStore((state) => isDemoToken(state.token));
  if (!demo) return null;

  return (
    <View
      style={{
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        borderRadius: HOME_METRICS.radius,
        borderWidth: 1,
        borderColor: C.bannerBorder,
        backgroundColor: C.bannerBg,
      }}>
      <View
        accessible
        accessibilityLabel="Demo mode in Baner, Pune. Orders, rider and GPS are simulated."
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <SvgXml xml={bannerDemoSvg} width={16} height={16} />
        <AppText variant="caption" numberOfLines={1} style={{ color: C.bannerInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
          Demo · Baner, Pune · simulated
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8 }}>
        <Pressable accessibilityRole="button" hitSlop={ACTION_HIT_SLOP} onPress={() => void confirmRestartDemo()}>
          <AppText variant="caption" style={{ color: C.bannerInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            Restart
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={ACTION_HIT_SLOP} onPress={() => void confirmExitDemo()}>
          <AppText variant="caption" style={{ color: C.bannerInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            Exit
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
