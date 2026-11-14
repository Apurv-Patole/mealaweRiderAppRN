import { Linking } from 'react-native';

import { AppText } from '@/components/ui';
import { env } from '@/config';

/** The rider privacy policy, served by the Mealawe server (same page the old rider app opens). */
export const PRIVACY_POLICY_URL = `${env.serverUrl}/public/riderPrivacyPolicy`;

/** "By continuing you agree to Mealawe's privacy policy", with the policy opening in the browser. */
export function LegalNote({ action = 'continuing' }: { action?: string }) {
  return (
    <AppText variant="caption" tone="muted" className="text-center">
      By {action} you agree to Mealawe&apos;s{' '}
      <AppText
        variant="caption"
        tone="primary"
        accessibilityRole="link"
        onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>
        privacy policy
      </AppText>
      .
    </AppText>
  );
}
