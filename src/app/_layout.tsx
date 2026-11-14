import '@/global.css';

import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DialogHost } from '@/components/dialog/DialogHost';
import { useDemoLifecycle } from '@/features/demo';
import { ForceUpdateScreen, useForceUpdateCheck } from '@/features/app-update';
import { SplashAnimationOverlay } from '@/features/splash';
import { PushBannerView } from '@/features/push/PushBannerView';
import { registerBackgroundHandler, startPush } from '@/services/push';
import { usePushReactions } from '@/features/push/usePushReactions';
import { setAuthTokenProvider, setUnauthorizedHandler } from '@/services/http';
// Imported for its module-scope `TaskManager.defineTask` side effect: the OS can start the app headless
// to deliver a location fix, and the task must already be defined when it does.
import '@/features/tracking/trackingTask';
import { abandonTracking } from '@/features/tracking/trackingControl';
import { useActionQueueStore } from '@/features/trip/actionQueueStore';
import { useRideStore } from '@/features/trip/rideStore';
import { useAppFlagsStore, useAuthStore, useThemeStore } from '@/store';
import { appFontMap } from '@/theme/fonts';
import { navigationDarkTheme, navigationLightTheme } from '@/theme/navigationTheme';

SplashScreen.preventAutoHideAsync();

// Wire the HTTP client to the auth store once, at module load. A 401 on an
// authenticated request means the session was revoked (for example the rider
// logged in on another phone): clearing it makes the route guard below show Login.
setAuthTokenProvider(() => useAuthStore.getState().token);
setUnauthorizedHandler(() => {
  void useAuthStore.getState().clearSession();
});

useThemeStore.getState().hydrate();
useAppFlagsStore.getState().hydrate();
useActionQueueStore.getState().hydrate();
useRideStore.getState().hydrate();
// Android runs the app headless to deliver a data message, so this must exist before React mounts.
registerBackgroundHandler();

export default function RootLayout() {
  const scheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts(appFontMap);
  const status = useAuthStore((state) => state.status);
  const riderId = useAuthStore((state) => state.rider?.riderId);
  const onboardingDone = useAppFlagsStore((state) => state.onboardingDone);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  const updateStatus = useForceUpdateCheck();
  const [splashDone, setSplashDone] = useState(false);

  // The native splash is a static solid colour; drop it straight away so the animated overlay
  // (same colour, rendered below) takes over without a visible swap.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  // Register this phone for push and listen for events while a rider is signed in.
  useEffect(() => {
    if (status !== 'signedIn' || !riderId) return;
    return startPush(riderId);
  }, [status, riderId]);

  usePushReactions();
  // Demo mode: run the simulated GPS and clean up when the demo ends.
  useDemoLifecycle();

  // Signing out (or a revoked session) must end location sharing and drop unsent pings.
  useEffect(() => {
    if (status === 'signedOut') void abandonTracking().catch(() => undefined);
  }, [status]);

  // Hold the app (not the splash overlay) until the stored session, fonts and version check are ready.
  const isReady = status !== 'booting' && (fontsLoaded || !!fontError) && updateStatus !== 'checking';
  const finishSplash = useCallback(() => setSplashDone(true), []);
  const splashOverlay = splashDone ? null : <SplashAnimationOverlay onFinished={finishSplash} />;

  if (updateStatus === 'blocked') return <ForceUpdateScreen />;

  const signedOut = status === 'signedOut';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {isReady ? (
          <ThemeProvider value={scheme === 'dark' ? navigationDarkTheme : navigationLightTheme}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Protected guard={signedOut && !onboardingDone}>
                <Stack.Screen name="onboarding" />
              </Stack.Protected>
              <Stack.Protected guard={signedOut && onboardingDone}>
                <Stack.Screen name="login" />
                <Stack.Screen name="register" />
              </Stack.Protected>
              <Stack.Protected guard={status === 'signedIn'}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="permissions" />
                <Stack.Screen name="odometer" options={{ presentation: 'modal' }} />
                <Stack.Screen name="selfie" options={{ presentation: 'fullScreenModal' }} />
                <Stack.Screen name="order/[id]" />
                <Stack.Screen name="deliver/[id]" />
                <Stack.Screen name="delivered/[id]" options={{ gestureEnabled: false }} />
                <Stack.Screen name="cancel/[id]" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }} />
                <Stack.Screen name="wallet" />
                <Stack.Screen name="shift-orders/[meal]" />
                <Stack.Screen name="edit-profile" />
                <Stack.Screen name="shift-summary" />
                <Stack.Screen name="history/attendance" />
                <Stack.Screen name="history/orders" />
              </Stack.Protected>
            </Stack>
            <PushBannerView />
            <DialogHost />
          </ThemeProvider>
        ) : null}
        {splashOverlay}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
