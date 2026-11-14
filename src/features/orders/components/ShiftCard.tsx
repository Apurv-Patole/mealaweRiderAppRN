import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import type { SlotWindow } from '@/features/shift/slots';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { Chevron } from '../home/HomeIcons';
import { checkCircleSvg, clockMutedSvg, clockWhiteSvg, scooterLimeSvg } from '../home/homeSvgSources';
import { HOME_METRICS } from '../home/homeTheme';
import type { SlotStat } from '../orderStats';
import { PHASE_LABEL, type SlotPhase } from '../slotPhase';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

interface ShiftCardProps {
  slot: SlotWindow;
  stat: SlotStat;
  phase: SlotPhase;
  onPress: () => void;
}

interface Palette {
  value: string;
  label: string;
}

function Figures({ stat, size, palette, lineHeight, tracking }: { stat: SlotStat; size: number; palette: Palette; lineHeight: number; tracking: number }) {
  const items = [
    { value: stat.total, label: 'Total' },
    { value: stat.pickedUp, label: 'Pickup' },
    { value: stat.done, label: 'Delivered' },
    { value: stat.pending, label: 'Pending' },
  ];
  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map((item) => (
        <View key={item.label} style={{ flex: 1, gap: 1 }}>
          <AppText style={{ color: palette.value, fontFamily: FONT_FAMILY.bold, fontSize: size, lineHeight, letterSpacing: tracking }}>{item.value}</AppText>
          <AppText variant="caption" style={{ color: palette.label, fontSize: 11, lineHeight: 16.5 }}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function TimeRow({ label, dark }: { label: string; dark: boolean }) {
  const C = useHomeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <SvgXml xml={dark ? clockWhiteSvg : clockMutedSvg} width={14} height={14} />
      <AppText variant="caption" style={{ color: dark ? C.onActiveSoft : C.muted, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </View>
  );
}

/** Status pill for a calm (white) card: green "Completed" or outlined "Upcoming". */
function CalmPill({ phase }: { phase: Exclude<SlotPhase, 'ongoing'> }) {
  const C = useHomeColors();
  const completed = phase === 'completed';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: completed ? 10 : 11,
        paddingVertical: completed ? 4 : 5,
        borderRadius: 999,
        backgroundColor: completed ? C.completedBg : C.canvas,
        borderWidth: completed ? 0 : 1,
        borderColor: C.border,
      }}>
      <SvgXml xml={completed ? checkCircleSvg : clockMutedSvg} width={14} height={14} />
      <AppText variant="caption" style={{ color: completed ? C.completedInk : C.muted, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
        {PHASE_LABEL[phase]}
      </AppText>
    </View>
  );
}

/** The running shift: a dark green card with a live progress bar and a "View orders" action. */
function ActiveCard({ slot, stat }: Pick<ShiftCardProps, 'slot' | 'stat'>) {
  const C = useHomeColors();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: HOME_METRICS.radius,
        backgroundColor: C.activeBg,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 15,
          borderBottomWidth: 1,
          borderBottomColor: C.activeGlassBorder,
        }}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <AppText variant="title" style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 18, lineHeight: 28 }}>
            {slot.meal}
          </AppText>
          <TimeRow label={slot.label} dark />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 13,
            paddingVertical: 5,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.activeGlassBorder,
            backgroundColor: C.activeGlass,
          }}>
          <SvgXml xml={scooterLimeSvg} width={14} height={14} />
          <AppText variant="caption" style={{ color: C.lime, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            {PHASE_LABEL.ongoing}
          </AppText>
        </View>
      </View>

      <View style={{ paddingTop: 14, paddingBottom: 20 }}>
        <Figures stat={stat} size={20} lineHeight={28} tracking={-0.5} palette={{ value: C.onGreen, label: C.onActiveFaint }} />
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: stat.progressPct }}
        style={{ height: 6, borderRadius: 3, backgroundColor: C.activeGlass, overflow: 'hidden' }}>
        <View style={{ height: 6, borderRadius: 3, width: `${stat.progressPct}%`, backgroundColor: C.lime }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
        <AppText variant="caption" style={{ color: C.onActiveSoft, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
          {stat.progressPct}% completed
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <AppText variant="caption" style={{ color: C.onGreen, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            View orders
          </AppText>
          <Chevron onDark />
        </View>
      </View>
    </View>
  );
}

/** A finished or upcoming shift: a white card with its window, status pill and counts. */
function CalmCard({ slot, stat, phase }: Pick<ShiftCardProps, 'slot' | 'stat'> & { phase: Exclude<SlotPhase, 'ongoing'> }) {
  const C = useHomeColors();
  return (
    <View style={{ padding: 17, borderRadius: HOME_METRICS.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 15,
          borderBottomWidth: 1,
          borderBottomColor: C.hairline,
        }}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <AppText variant="title" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24 }}>
            {slot.meal}
          </AppText>
          <TimeRow label={slot.label} dark={false} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalmPill phase={phase} />
          <Chevron />
        </View>
      </View>
      <View style={{ paddingTop: 12 }}>
        <Figures stat={stat} size={16} lineHeight={24} tracking={0} palette={{ value: C.ink, label: C.muted }} />
      </View>
    </View>
  );
}

/** One meal shift: its time window, status and order counts. Opens that shift's orders. */
export function ShiftCard({ slot, stat, phase, onPress }: ShiftCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${slot.meal} shift, ${PHASE_LABEL[phase]}, ${stat.total} orders. Open orders.`}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {phase === 'ongoing' ? <ActiveCard slot={slot} stat={stat} /> : <CalmCard slot={slot} stat={stat} phase={phase} />}
    </Pressable>
  );
}
