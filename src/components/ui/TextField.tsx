import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { FONT_FAMILY, RADIUS, TOUCH, useColors } from '@/theme';

import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  /** An icon inside the field, before the text. */
  leadingIcon?: LucideIcon;
  /** Fixed text before the value, for example "+91". */
  prefix?: string;
}

/**
 * A labelled input on a filled surface: no outline at rest, a 2 px brand ring while focused,
 * a red ring on error. The fill (not a hairline) is what separates it from the page.
 */
export function TextField({ label, error, leadingIcon: LeadingIcon, prefix, onFocus, onBlur, editable = true, ...props }: TextFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  const ring = error ? colors.danger : focused ? colors.primary : 'transparent';

  return (
    <View className="gap-2">
      <AppText variant="label">{label}</AppText>
      <View
        className="flex-row items-center"
        style={{
          minHeight: TOUCH.primaryButton,
          paddingHorizontal: 16,
          gap: 10,
          borderRadius: RADIUS.button,
          borderWidth: 2,
          borderColor: ring,
          backgroundColor: colors.muted,
          opacity: editable ? 1 : 0.7,
        }}>
        {LeadingIcon ? <LeadingIcon size={20} color={focused ? colors.primary : colors.mutedForeground} /> : null}
        {prefix ? (
          <AppText variant="button" tone="muted">
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedForeground}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{ flex: 1, minHeight: TOUCH.primaryButton - 4, color: colors.foreground, fontSize: 16, fontFamily: FONT_FAMILY.regular }}
          {...props}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
