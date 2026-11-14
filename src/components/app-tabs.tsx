import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useColors } from '@/theme';
import { palette } from '@/theme/palette';
import { useTabBadgeStore } from '@/store/tabBadgeStore';

/** Badge text stays one or two characters wide so it does not cover the tab icon. */
const MAX_BADGE_DIGIT = 9;
const BADGE_TEXT_COLOR = '#1f1300';

function shortBadge(count: number): string {
  if (count <= 0) return '';
  return count > MAX_BADGE_DIGIT ? `${MAX_BADGE_DIGIT}+` : String(count);
}

/**
 * The whole bottom tab bar lives in this one file. It is a NATIVE tab bar
 * (UITabBarController on iOS, Material 3 navigation bar on Android) through
 * Expo Router's `NativeTabs`, which is still an `unstable_` API: if an Expo
 * upgrade changes it, this is the only place to fix (fallback: the JS `Tabs`
 * with the same colors). Colors come from the rider palette (plan section 5.3).
 *
 * iOS uses SF Symbols; Android uses template PNGs from `assets/images/tabIcons`
 * (regenerate with `npm run icons`).
 */
export default function AppTabs() {
  const colors = useColors();
  const ordersBadge = shortBadge(useTabBadgeStore((state) => state.ordersCount));

  return (
    <NativeTabs
      backgroundColor={colors.card}
      indicatorColor={colors.primarySoft}
      iconColor={{ default: colors.mutedForeground, selected: colors.primary }}
      labelStyle={{
        default: { color: colors.mutedForeground },
        selected: { color: colors.primary },
      }}
      badgeBackgroundColor={palette.accent.gold}
      badgeTextColor={BADGE_TEXT_COLOR}
      labelVisibilityMode="labeled"
      minimizeBehavior="never">
      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house"
          src={require('../../assets/images/tabIcons/orders.png')}
          renderingMode="template"
        />
        <NativeTabs.Trigger.Badge hidden={!ordersBadge}>{ordersBadge}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="route">
        <NativeTabs.Trigger.Label>Route</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="map"
          src={require('../../assets/images/tabIcons/route.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person"
          src={require('../../assets/images/tabIcons/profile.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
