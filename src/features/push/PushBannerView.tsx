import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useStatusColors } from '@/theme';

import { usePushBannerStore } from './pushBannerStore';

/** How long a notice stays before it disappears on its own. */
const BANNER_MS = 6_000;

/** A notice at the top of the screen for push events that arrive while the app is open. Tap to dismiss. */
export function PushBannerView() {
  const banner = usePushBannerStore((state) => state.banner);
  const insets = useSafeAreaInsets();
  const colors = useStatusColors(banner?.tone ?? 'assigned');

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => usePushBannerStore.getState().dismiss(), BANNER_MS);
    return () => clearTimeout(timer);
  }, [banner]);

  if (!banner) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }}>
      <Pressable
        onPress={() => usePushBannerStore.getState().dismiss()}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        accessibilityLabel={`${banner.title}. ${banner.message}`}
        accessibilityHint="Double tap to dismiss"
        style={{
          borderRadius: 14,
          borderLeftWidth: 6,
          borderLeftColor: colors.fill,
          backgroundColor: colors.soft,
          paddingHorizontal: 14,
          paddingVertical: 12,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}>
        <AppText variant="title" style={{ color: colors.ink }}>
          {banner.title}
        </AppText>
        <AppText style={{ color: colors.ink }}>{banner.message}</AppText>
      </Pressable>
    </View>
  );
}
