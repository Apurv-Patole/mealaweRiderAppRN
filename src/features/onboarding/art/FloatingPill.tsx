import { View, type ViewStyle } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';
import { useOnboardingColors } from '@/features/onboarding/useOnboardingColors';


interface FloatingPillProps {
  iconXml: string;
  iconSize: number;
  label: string;
  fontSize: number;
  paddingHorizontal: number;
  /** Absolute position in design points. */
  position: ViewStyle;
}

/** Frosted-glass chip that floats on the map. The label is read by screen readers; the icon is decoration. */
export function FloatingPill({ iconXml, iconSize, label, fontSize, paddingHorizontal, position }: FloatingPillProps) {
  const onboardingColors = useOnboardingColors();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[
        {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: onboardingColors.pillBorder,
          backgroundColor: onboardingColors.pillGlass,
          shadowColor: '#000000',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        position,
      ]}>
      <SvgXml xml={iconXml} width={iconSize} height={iconSize} />
      <AppText
        variant="caption"
        style={{ color: onboardingColors.ink, fontFamily: FONT_FAMILY.bold, fontSize, lineHeight: fontSize * 1.5 }}>
        {label}
      </AppText>
    </View>
  );
}
