import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';
import { useLoginColors } from '@/features/auth/login/useLoginColors';


interface OtpHeadingProps {
  codeLength: number;
  phone: string;
  disabled?: boolean;
  onChangeNumber: () => void;
}

/** "Enter the code" title, the number the SMS went to, and a link back to change it. Type sizes follow the design. */
export function OtpHeading({ codeLength, phone, disabled = false, onChangeNumber }: OtpHeadingProps) {
  const C = useLoginColors();
  return (
    <View style={{ gap: 7 }}>
      <AppText variant="display" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 28, lineHeight: 35, letterSpacing: -0.7 }}>
        Enter the code
      </AppText>
      <AppText style={{ color: C.body, fontSize: 15, lineHeight: 24.38 }}>
        We sent a {codeLength}-digit code to{' '}
        <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 24.38 }}>+91 {phone}</AppText>.
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change number"
        disabled={disabled}
        hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
        onPress={onChangeNumber}
        style={{ alignSelf: 'flex-start', paddingTop: 9, opacity: disabled ? 0.5 : 1 }}>
        <AppText style={{ color: C.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21 }}>Change number</AppText>
      </Pressable>
    </View>
  );
}
