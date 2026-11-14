import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import type { DeliveryDateOption } from '../deliveryDate';
import { HOME_METRICS } from '../home/homeTheme';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

interface DateStripProps {
  options: readonly DeliveryDateOption[];
  selectedOffset: number;
  onSelect: (offset: number) => void;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function topLine(option: DeliveryDateOption): string {
  if (option.offset === 0) return 'Today';
  if (option.offset === 1) return 'Tomorrow';
  return WEEKDAY_SHORT[option.date.getDay()] ?? '';
}

/** Today, Tomorrow and the days after, as equal-width date tiles that fit one row (day number large, month small). */
export function DateStrip({ options, selectedOffset, onSelect }: DateStripProps) {
  const C = useHomeColors();
  return (
    <View style={{ flexDirection: 'row', gap: HOME_METRICS.dateGap }}>
      {options.map((option) => {
        const selected = option.offset === selectedOffset;
        const ink = selected ? C.onGreen : C.ink;
        const soft = selected ? C.onActiveDate : C.muted;
        return (
          <Pressable
            key={option.offset}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${topLine(option)}, ${option.date.getDate()} ${MONTH_SHORT[option.date.getMonth()]}`}
            onPress={() => {
              haptics.tap();
              onSelect(option.offset);
            }}
            style={{
              flex: 1,
              height: HOME_METRICS.dateTileHeight,
              borderRadius: HOME_METRICS.radius,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? C.green : C.card,
              borderWidth: selected ? 0 : 1,
              borderColor: C.border,
            }}>
            <AppText variant="caption" numberOfLines={1} style={{ color: soft, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16.5, letterSpacing: -0.275 }}>
              {topLine(option)}
            </AppText>
            <AppText style={{ color: ink, fontFamily: FONT_FAMILY.extrabold, fontSize: 24, lineHeight: 24, letterSpacing: -0.6, paddingVertical: 4 }}>
              {option.date.getDate()}
            </AppText>
            <AppText variant="caption" style={{ color: soft, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16.5 }}>
              {MONTH_SHORT[option.date.getMonth()]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
