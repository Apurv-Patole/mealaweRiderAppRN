import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { otpCells } from '../otp';
import { digitsOnly } from '../validation';
import { LOGIN_METRICS } from './loginTheme';
import { iconErrorSvg } from './svgSources';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

interface OtpCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  length: number;
  error?: string | null;
  editable?: boolean;
}

/**
 * One-time-code input from the design: white 60 pt boxes with bold 24 pt digits, red outline and message on a
 * wrong code. A single invisible TextInput sits on top, so the keyboard, paste and the system's SMS code
 * suggestion (autofill) all work normally.
 */
export function OtpCodeField({ value, onChange, length, error, editable = true }: OtpCodeFieldProps) {
  const C = useLoginColors();
  const inputRef = useRef<TextInput>(null);
  const cells = otpCells(value, length);

  return (
    <View>
      <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="One-time code" accessibilityRole="none">
        <View style={{ flexDirection: 'row', gap: LOGIN_METRICS.otpGap }}>
          {cells.map((cell, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: LOGIN_METRICS.otpBoxHeight,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: LOGIN_METRICS.radius,
                borderWidth: 1,
                borderColor: error ? C.error : cell.active && editable ? C.greenInk : C.border,
                backgroundColor: C.surface,
                shadowColor: '#000000',
                shadowOpacity: 0.05,
                shadowRadius: 1,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}>
              <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 24, lineHeight: 32 }}>{cell.char}</AppText>
            </View>
          ))}
        </View>
        <TextInput
          ref={inputRef}
          testID="otp-input"
          value={value}
          onChangeText={(text) => onChange(digitsOnly(text, length))}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          maxLength={length}
          editable={editable}
          autoFocus
          caretHidden
          accessibilityLabel="One-time code input"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0 }}
        />
      </Pressable>
      {error ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12 }}>
          <SvgXml xml={iconErrorSvg} width={14} height={14} />
          <AppText variant="caption" style={{ color: C.error, fontSize: 12.5, lineHeight: 18.75, letterSpacing: -0.312, flexShrink: 1 }}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
