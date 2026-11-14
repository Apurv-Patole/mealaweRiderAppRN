import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { SPLASH, STORE_URLS } from '@/config/constants';

/** Full-screen, non-dismissible "update required" gate: one message, one button, no way past it. */
export function ForceUpdateScreen() {
  function openStore(): void {
    const url = Platform.OS === 'ios' ? STORE_URLS.appStore : STORE_URLS.playStore;
    void Linking.openURL(url);
  }

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: SPLASH.backgroundColor }}>
      <StatusBar style="light" />
      <BrandMark size={96} />
      <AppText variant="h2" className="mt-6 text-center text-white">
        Update required
      </AppText>
      <AppText variant="body" className="mt-2 px-4 text-center text-white/85">
        A new version of Mealawe Rider is available. Please update to keep using the app.
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Update now"
        onPress={openStore}
        className="mt-7 w-full items-center justify-center rounded-2xl bg-white"
        style={{ minHeight: 56 }}>
        <AppText variant="body" style={{ color: SPLASH.backgroundColor, fontWeight: '700' }}>
          Update Now
        </AppText>
      </Pressable>
    </View>
  );
}
