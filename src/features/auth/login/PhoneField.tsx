import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { LOGIN_METRICS } from './loginTheme';
import { iconErrorSvg } from './svgSources';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

const DIAL_CODE = '+91';

interface PhoneFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: string | null;
}

/** Phone input from the design: white box, `+91` prefix, hairline divider, red outline and message on error. */
export function PhoneField({ label, error, onFocus, onBlur, editable = true, ...props }: PhoneFieldProps) {
  const C = useLoginColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? C.error : focused ? C.greenInk : C.border;

  return (
    <View>
      <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21, paddingBottom: 8 }}>{label}</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: LOGIN_METRICS.fieldHeight,
          paddingHorizontal: 15,
          borderRadius: LOGIN_METRICS.radius,
          borderWidth: 1,
          borderColor,
          backgroundColor: C.surface,
          opacity: editable ? 1 : 0.7,
        }}>
        <AppText style={{ color: C.ink, fontSize: 16, lineHeight: 24, paddingRight: 12 }}>{DIAL_CODE}</AppText>
        <View style={{ width: 0.83, height: 24, backgroundColor: C.separator, marginRight: 14 }} />
        <TextInput
          accessibilityLabel={`${label}, after ${DIAL_CODE}`}
          placeholderTextColor={C.muted}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{ flex: 1, height: '100%', color: C.ink, fontSize: 16, fontFamily: FONT_FAMILY.regular, paddingVertical: 0 }}
          {...props}
        />
      </View>
      {error ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 }}>
          <SvgXml xml={iconErrorSvg} width={14} height={14} />
          <AppText variant="caption" style={{ color: C.error, fontSize: 12, lineHeight: 18, flexShrink: 1 }}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
