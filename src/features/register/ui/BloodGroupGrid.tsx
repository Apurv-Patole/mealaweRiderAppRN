import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { chunk } from './registerFormat';
import { REGISTER_METRICS } from './registerTheme';
import { chipCheckSvg } from './svgSources';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

interface BloodGroupGridProps {
  label: string;
  /** Small grey text on the right of the label row. */
  labelHint?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

/** Four-column grid of blood-group buttons. The chosen one gets a green tint, ring and tick; tap it again to clear. */
export function BloodGroupGrid({ label, labelHint, options, value, onChange }: BloodGroupGridProps) {
  const C = useRegisterColors();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20, flexShrink: 1 }}>{label}</AppText>
        {labelHint ? (
          <AppText variant="caption" numberOfLines={1} style={{ color: C.muted, fontSize: 11, lineHeight: 16, flexShrink: 1 }}>
            {labelHint}
          </AppText>
        ) : null}
      </View>
      <View style={{ gap: 8 }}>
        {chunk(options, REGISTER_METRICS.bloodColumns).map((row) => (
          <View key={row.join('-')} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((option) => {
              const selected = option === value;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Blood group ${option}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    haptics.tap();
                    onChange(selected ? '' : option);
                  }}
                  style={{
                    flex: 1,
                    height: REGISTER_METRICS.bloodChipHeight,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    borderRadius: REGISTER_METRICS.fieldRadius,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? C.greenInk : C.fieldBorder,
                    backgroundColor: selected ? C.tile : C.card,
                  }}>
                  <AppText style={{ color: selected ? C.greenDeep : C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>
                    {option}
                  </AppText>
                  {selected ? <SvgXml xml={chipCheckSvg} width={10.44} height={7.96} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
