import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useAuthStore } from '@/store';
import { palette } from '@/theme/palette';

import { confirmExitDemo, confirmRestartDemo } from './demoActions';
import { isDemoToken } from './demoSession';

/**
 * A small pill over the top of the tabs while the demo is running: says the data is simulated and
 * offers "Restart" (new orders, no shift) and "Exit" (back to the login screen). Home shows its own
 * inline banner instead (`DemoBannerInline`), so the layout hides this pill there.
 */
export function DemoBanner() {
  const insets = useSafeAreaInsets();
  const demo = useAuthStore((state) => isDemoToken(state.token));
  if (!demo) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 2, left: 0, right: 0, alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: palette.brand.primary,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 4,
          elevation: 6,
        }}>
        <AppText variant="caption" tone="inverse" accessibilityLabel="Demo mode in Baner, Pune. Orders, rider and GPS are simulated.">
          DEMO · Baner, Pune · simulated
        </AppText>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void confirmRestartDemo()}>
          <AppText variant="label" tone="inverse">Restart</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void confirmExitDemo()}>
          <AppText variant="label" tone="inverse">Exit</AppText>
        </Pressable>
      </View>
    </View>
  );
}
