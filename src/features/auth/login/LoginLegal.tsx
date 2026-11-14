import { Linking } from 'react-native';

import { AppText } from '@/components/ui';
import { PRIVACY_POLICY_URL } from '@/features/auth/LegalNote';
import { FONT_FAMILY } from '@/theme';
import { useLoginColors } from '@/features/auth/login/useLoginColors';


/** "By continuing you agree to Mealawe's privacy policy." with the policy link underlined in green. */
export function LoginLegal() {
  const C = useLoginColors();
  return (
    <AppText variant="caption" style={{ color: C.muted, fontSize: 12, lineHeight: 15, textAlign: 'center' }}>
      By continuing you agree to Mealawe&apos;s{' '}
      <AppText
        variant="caption"
        accessibilityRole="link"
        onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        style={{ color: C.greenInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 15, textDecorationLine: 'underline' }}>
        privacy policy
      </AppText>
      .
    </AppText>
  );
}
