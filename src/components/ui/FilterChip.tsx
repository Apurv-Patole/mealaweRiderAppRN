import { Pressable } from 'react-native';

import { FONT_FAMILY, RADIUS, TOUCH, useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

import { AppText } from './AppText';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** A shorter chip for long rows such as zones. */
  compact?: boolean;
}

/** A tappable filter pill (date, cluster, slot). 48 dp tall for thumb use. */
export function FilterChip({ label, selected, onPress, compact = false }: FilterChipProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={{
        minHeight: compact ? 40 : TOUCH.min,
        paddingHorizontal: compact ? 14 : 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.chip,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.card,
      }}>
      <AppText variant={compact ? 'caption' : 'label'} style={{ fontFamily: FONT_FAMILY.bold, color: selected ? colors.primaryForeground : colors.foreground }}>
        {label}
      </AppText>
    </Pressable>
  );
}
