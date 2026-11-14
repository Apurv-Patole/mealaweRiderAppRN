import { Pressable } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { iconRetrySvg } from './svgSources';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

interface ResendLinkProps {
  /** Seconds until a new code can be requested; 0 means ready. */
  secondsLeft: number;
  disabled?: boolean;
  onPress: () => void;
}

/** "Resend code" with the retry icon; counts down while the previous code is still valid to request again. */
export function ResendLink({ secondsLeft, disabled = false, onPress }: ResendLinkProps) {
  const C = useLoginColors();
  const waiting = secondsLeft > 0;
  const isDisabled = waiting || disabled;
  const color = waiting ? C.muted : C.greenInk;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', opacity: isDisabled && !waiting ? 0.5 : 1 }}>
      <SvgXml xml={iconRetrySvg} width={16} height={16} />
      <AppText style={{ color, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21 }}>
        {waiting ? `Resend code in ${secondsLeft}s` : 'Resend code'}
      </AppText>
    </Pressable>
  );
}
