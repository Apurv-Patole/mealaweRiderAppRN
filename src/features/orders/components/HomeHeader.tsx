import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { initialsOf } from '@/components/ui/Avatar';
import type { RiderProfile } from '@/features/auth';
import { FONT_FAMILY } from '@/theme';

import { HOME_METRICS } from '../home/homeTheme';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

interface HomeHeaderProps {
  rider: RiderProfile | null;
  /** The line under the name, for example "Lunch shift is active". */
  statusText: string;
  /** Green dot while a shift is on, grey otherwise. */
  live: boolean;
}

/** The top of Home: the rider's initials, name and shift status. Flat on the page, no hero slab. */
export function HomeHeader({ rider, statusText, live }: HomeHeaderProps) {
  const C = useHomeColors();
  const insets = useSafeAreaInsets();
  const name = rider?.name || 'Rider';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: HOME_METRICS.avatar,
          height: HOME_METRICS.avatar,
          borderRadius: HOME_METRICS.avatar / 2,
          borderWidth: 1,
          borderColor: C.initialsBorder,
          backgroundColor: C.initialsBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <AppText style={{ color: C.initialsInk, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24, letterSpacing: -0.4 }}>
          {initialsOf(name)}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h2" numberOfLines={1} style={{ color: C.title, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 30, letterSpacing: -0.5 }}>
          {name}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: live ? C.green : C.dotOff }} />
          <AppText variant="caption" style={{ color: C.muted, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
            {statusText}
          </AppText>
        </View>
      </View>
    </View>
  );
}
