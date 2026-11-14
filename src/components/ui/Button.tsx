import { ActivityIndicator, Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';

import { RADIUS, TOUCH, useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  /** `lg` is the 56 dp main action, thumb-friendly and full width at the bottom of a screen. */
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
}

const HEIGHT: Record<ButtonSize, number> = {
  md: TOUCH.min,
  lg: TOUCH.primaryButton,
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  block = true,
  loading = false,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const handlePress = (event: GestureResponderEvent) => {
    haptics.tap();
    onPress?.(event);
  };

  const fill =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const pressedFill =
    variant === 'primary' ? colors.primaryPressed : variant === 'danger' ? colors.danger : colors.muted;
  const textColor =
    variant === 'primary'
      ? colors.primaryForeground
      : variant === 'danger'
        ? colors.dangerForeground
        : variant === 'ghost'
          ? colors.primary
          : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => ({
        height: HEIGHT[size],
        minWidth: TOUCH.min,
        alignSelf: block ? 'stretch' : 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        borderRadius: RADIUS.button,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: colors.border,
        backgroundColor: pressed ? pressedFill : fill,
        opacity: isDisabled ? 0.5 : 1,
      })}
      {...props}>
      {loading ? <ActivityIndicator color={textColor} /> : null}
      <AppText variant="button" style={{ color: textColor }}>
        {label}
      </AppText>
    </Pressable>
  );
}
