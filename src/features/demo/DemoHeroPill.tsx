import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui';
import { HERO_FIXED } from '@/features/profile/profileTheme';
import { useAuthStore } from '@/store';
import { FONT_FAMILY } from '@/theme';

import { confirmExitDemo, confirmRestartDemo } from './demoActions';
import { isDemoToken } from './demoSession';

const ACTION_HIT_SLOP = 12;

const TEXT = { fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 16, letterSpacing: -0.275 } as const;
const ACTION = { color: '#ffffff', fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16 } as const;

/** The demo strip on the Profile hero: a dark glass pill saying the data is simulated, with Restart and Exit. */
export function DemoHeroPill() {
  const demo = useAuthStore((state) => isDemoToken(state.token));
  if (!demo) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: HERO_FIXED.demoPillBorder,
        backgroundColor: HERO_FIXED.demoPillBg,
      }}>
      <View
        accessible
        accessibilityLabel="Demo mode in Baner, Pune. Orders, rider and GPS are simulated."
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
        <AppText style={{ ...TEXT, color: HERO_FIXED.demoLime, fontFamily: FONT_FAMILY.semibold }}>DEMO</AppText>
        <AppText style={{ ...TEXT, color: HERO_FIXED.demoText }}>•</AppText>
        <AppText numberOfLines={1} style={{ ...TEXT, color: HERO_FIXED.demoText, flexShrink: 1 }}>Baner, Pune</AppText>
        <AppText style={{ ...TEXT, color: HERO_FIXED.demoText }}>•</AppText>
        <AppText style={{ ...TEXT, color: HERO_FIXED.demoSoft }}>simulated</AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
        <Pressable accessibilityRole="button" hitSlop={ACTION_HIT_SLOP} onPress={() => void confirmRestartDemo()}>
          <AppText style={ACTION}>Restart</AppText>
        </Pressable>
        <AppText style={{ ...ACTION, color: 'rgba(255,255,255,0.4)' }}>|</AppText>
        <Pressable accessibilityRole="button" hitSlop={ACTION_HIT_SLOP} onPress={() => void confirmExitDemo()}>
          <AppText style={ACTION}>Exit</AppText>
        </Pressable>
      </View>
    </View>
  );
}
