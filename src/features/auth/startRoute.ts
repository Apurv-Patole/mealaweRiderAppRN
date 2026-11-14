export type StartRoute = '/(tabs)/orders' | '/login' | '/onboarding';

/** Where the app's root URL ("/") sends the rider, from the session and the first-run flag. */
export function startRoute(signedIn: boolean, onboardingDone: boolean): StartRoute {
  if (signedIn) return '/(tabs)/orders';
  return onboardingDone ? '/login' : '/onboarding';
}
