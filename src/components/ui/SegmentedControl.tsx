import { Pressable, View } from 'react-native';

import { useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

import { AppText } from './AppText';

interface SegmentedControlProps<T extends string | number> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Two to four equal choices in one rounded track, with the chosen one lifted: Today / Tomorrow, themes. */
export function SegmentedControl<T extends string | number>({ options, value, onChange }: SegmentedControlProps<T>) {
  const colors = useColors();

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row rounded-2xl bg-muted p-1"
      style={{ gap: 4 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.tap();
              onChange(option.value);
            }}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              paddingHorizontal: 8,
              backgroundColor: selected ? colors.card : 'transparent',
              borderWidth: selected ? 1 : 0,
              borderColor: colors.border,
            }}>
            <AppText
              variant="label"
              numberOfLines={1}
              style={{ color: selected ? colors.primary : colors.mutedForeground }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
