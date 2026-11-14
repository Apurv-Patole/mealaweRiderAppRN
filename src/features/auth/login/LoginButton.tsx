import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { LOGIN_METRICS, type LoginColors } from './loginTheme';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

export type LoginButtonTone = 'primary' | 'tonal';

interface LoginButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  tone?: LoginButtonTone;
  loading?: boolean;
}

interface ButtonLook {
  height: number;
  fill: string;
  text: string;
  fontSize: number;
  lineHeight: number;
}

function lookFor(tone: LoginButtonTone, C: LoginColors): ButtonLook {
  if (tone === 'primary') {
    return { height: LOGIN_METRICS.buttonHeight, fill: C.green, text: C.onGreen, fontSize: 16, lineHeight: 24 };
  }
  return { height: LOGIN_METRICS.demoButtonHeight, fill: C.chipBg, text: C.greenInk, fontSize: 15, lineHeight: 22.5 };
}

/** Buttons from the login design: solid green "Send code" and pale-green "Try the demo". */
export function LoginButton({ label, tone = 'primary', loading = false, disabled, onPress, ...props }: LoginButtonProps) {
  const C = useLoginColors();
  const look = lookFor(tone, C);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        haptics.tap();
        onPress?.(event);
      }}
      style={({ pressed }) => ({
        height: look.height,
        borderRadius: LOGIN_METRICS.radius,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        backgroundColor: look.fill,
        opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
      })}
      {...props}>
      {loading ? <ActivityIndicator color={look.text} /> : null}
      <AppText style={{ color: look.text, fontFamily: FONT_FAMILY.bold, fontSize: look.fontSize, lineHeight: look.lineHeight }}>{label}</AppText>
    </Pressable>
  );
}
