import { Redirect } from 'expo-router';

import { startRoute } from '@/features/auth/startRoute';
import { useAppFlagsStore, useAuthStore } from '@/store';

/**
 * Boot gate for the root URL ("/"). The tabs live at "/orders", "/route" and so on, so nothing
 * else owns "/", and without this screen the app opens on "Unmatched Route". `_layout.tsx` keeps
 * the splash up until the stored session has been read, so by the time this renders the auth
 * state is final. Routes:
 *   - signed in                    -> /(tabs)/orders
 *   - signed out, first run        -> /onboarding
 *   - signed out, onboarding done  -> /login
 */
export default function Index() {
  const signedIn = useAuthStore((state) => state.status === 'signedIn');
  const onboardingDone = useAppFlagsStore((state) => state.onboardingDone);

  return <Redirect href={startRoute(signedIn, onboardingDone)} />;
}
