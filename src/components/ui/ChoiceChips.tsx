import { Pressable, View } from 'react-native';

import { RADIUS, TOUCH, useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

import { AppText } from './AppText';

interface ChoiceChipsProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

/** Single-choice chips (for example blood group). Tap the selected chip again to clear it. */
export function ChoiceChips({ label, options, value, onChange }: ChoiceChipsProps) {
  const colors = useColors();

  return (
    <View className="gap-1.5">
      <AppText variant="label">{label}</AppText>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.tap();
                onChange(selected ? '' : option);
              }}
              style={{
                minHeight: TOUCH.min,
                minWidth: TOUCH.min,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: RADIUS.chip,
                backgroundColor: selected ? colors.primary : colors.muted,
              }}>
              <AppText variant="label" style={{ color: selected ? colors.primaryForeground : colors.foreground }}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
