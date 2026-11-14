import { useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { REGISTER_METRICS } from './registerTheme';
import { infoSvg } from './svgSources';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

interface RegisterFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  /** Adds the red asterisk. Only for fields the form really requires. */
  required?: boolean;
  /** Small grey text on the right of the label row, for example "For digital payout receipts". */
  labelHint?: string;
  /** Icon drawn inside the field, before the text. `xml` is an exported Figma SVG. */
  icon?: { xml: string; width: number; height: number; left: number };
  /** Anything else drawn inside the field before the text, for example the +91 prefix. */
  leading?: ReactNode;
  /** Left offset of `leading`. */
  leadingLeft?: number;
  /** Space reserved on the left for the icon or prefix. */
  paddingLeft?: number;
  /** Helper line under the field. */
  hint?: string;
  hintWithInfoIcon?: boolean;
  error?: string | null;
  letterSpacing?: number;
  /** `compact` is the address-step look: 12 pt label, 6 pt gap, 15 pt padding. */
  variant?: 'default' | 'compact';
  /** An action on the right of the label row, for example "Detect pincode". Replaces `labelHint`. */
  labelAction?: ReactNode;
  /** Pale-grey fill instead of white (the ID number fields). */
  filled?: boolean;
  /** Something drawn at the right end of the field, for example a green tick. */
  trailing?: ReactNode;
  /** Space reserved on the right, for `trailing`. */
  paddingRight?: number;
  /** Distance of `trailing` from the right edge. */
  trailingRight?: number;
  /** `success` shows the helper line in green, for a passed check. */
  hintTone?: 'muted' | 'success';
}

/** Text field from the registration design: 48 pt white box, 8 pt corners, green focus ring, red on error. */
export function RegisterField({
  label,
  required = false,
  labelHint,
  icon,
  leading,
  leadingLeft = 10,
  paddingLeft,
  variant = 'default',
  labelAction,
  filled = false,
  trailing,
  paddingRight,
  trailingRight = 12,
  hintTone = 'muted',
  hint,
  hintWithInfoIcon = false,
  error,
  letterSpacing,
  editable = true,
  onFocus,
  onBlur,
  ...inputProps
}: RegisterFieldProps) {
  const C = useRegisterColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? C.required : focused ? C.greenInk : C.fieldBorder;
  const compact = variant === 'compact';
  const labelSize = compact ? 12 : 14;
  const labelLine = compact ? 16 : 20;
  const inset = compact ? 15 : 13;

  return (
    <View style={{ gap: compact ? 6 : 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: labelSize, lineHeight: labelLine, flexShrink: 1 }}>
          {label}
          {required ? <AppText style={{ color: C.required, fontFamily: FONT_FAMILY.bold, fontSize: labelSize, lineHeight: labelLine }}> *</AppText> : null}
        </AppText>
        {labelAction ? (
          labelAction
        ) : labelHint ? (
          <AppText variant="caption" numberOfLines={1} style={{ color: C.placeholder, fontSize: 11, lineHeight: 16, flexShrink: 1 }}>
            {labelHint}
          </AppText>
        ) : null}
      </View>

      <View style={{ justifyContent: 'center', opacity: editable ? 1 : 0.7 }}>
        <TextInput
          accessibilityLabel={required ? `${label}, required` : label}
          placeholderTextColor={C.placeholder}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{
            height: REGISTER_METRICS.fieldHeight,
            paddingLeft: paddingLeft ?? inset,
            paddingRight: paddingRight ?? inset,
            paddingVertical: 0,
            borderRadius: REGISTER_METRICS.fieldRadius,
            borderWidth: 1,
            borderColor,
            backgroundColor: filled ? C.canvas : C.card,
            color: C.ink,
            fontFamily: FONT_FAMILY.regular,
            fontSize: 14,
            letterSpacing,
          }}
          {...inputProps}
        />
        {icon ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: icon.left }}>
            <SvgXml xml={icon.xml} width={icon.width} height={icon.height} />
          </View>
        ) : null}
        {trailing ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', right: trailingRight }}>
            {trailing}
          </View>
        ) : null}
        {leading ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: leadingLeft, flexDirection: 'row', alignItems: 'center' }}>
            {leading}
          </View>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" accessibilityLiveRegion="polite" style={{ color: C.required, fontSize: 11, lineHeight: 16 }}>
          {error}
        </AppText>
      ) : hint ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {hintWithInfoIcon ? <SvgXml xml={infoSvg} width={10.83} height={10.83} /> : null}
          <AppText variant="caption" style={{ color: hintTone === 'success' ? C.success : C.muted, fontSize: 11, lineHeight: 16, flexShrink: 1 }}>
            {hint}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
