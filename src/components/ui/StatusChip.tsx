import { View } from 'react-native';

import { FONT_FAMILY, useStatusColors, type StatusTone } from '@/theme';

import { AppText } from './AppText';

interface StatusChipProps {
  tone: StatusTone;
  label: string;
}

/**
 * Status is never colour alone: a coloured dot, the label, and a soft
 * background. Text uses the "ink" colour so it passes contrast on light
 * surfaces; the dot uses the "fill" colour.
 */
export function StatusChip({ tone, label }: StatusChipProps) {
  const colors = useStatusColors(tone);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.soft,
      }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fill }} />
      <AppText variant="caption" style={{ fontFamily: FONT_FAMILY.bold, color: colors.ink }}>
        {label}
      </AppText>
    </View>
  );
}
