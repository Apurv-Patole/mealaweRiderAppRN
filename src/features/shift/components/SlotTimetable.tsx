import { CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { FONT_FAMILY } from '@/theme';

import type { SlotRow, SlotState } from '../slots';
import { useShiftColors } from '../useShiftColors';
import { slotMissedSvg, slotOpenSvg, slotUpcomingSvg } from '../ui/shiftSvgSources';

const LABEL: Record<SlotState, string> = {
  ongoing: 'Open now',
  completed: 'Worked',
  upcoming: 'Upcoming',
  missed: 'Missed',
};

/** The status pill at the right of a slot row: missed (red), open now (blue), worked (green) or upcoming (grey). */
function SlotPill({ state }: { state: SlotState }) {
  const shift = useShiftColors();
  const home = useHomeColors();
  const look = {
    missed: { bg: shift.missedBg, ink: shift.missedInk },
    ongoing: { bg: shift.openBg, ink: shift.openInk },
    completed: { bg: home.completedBg, ink: home.completedInk },
    upcoming: { bg: shift.upcomingBg, ink: shift.upcomingInk },
  }[state];

  return (
    <View
      accessible
      accessibilityLabel={LABEL[state]}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: look.bg }}>
      {state === 'missed' ? (
        <SvgXml xml={slotMissedSvg} width={12} height={12} />
      ) : state === 'ongoing' ? (
        <SvgXml xml={slotOpenSvg} width={12} height={12} />
      ) : state === 'upcoming' ? (
        <SvgXml xml={slotUpcomingSvg} width={12} height={12} />
      ) : (
        <CircleCheck size={12} color={look.ink} strokeWidth={2.2} />
      )}
      <AppText variant="caption" style={{ color: look.ink, fontFamily: FONT_FAMILY.medium, fontSize: 11.5, lineHeight: 17.25 }}>
        {LABEL[state]}
      </AppText>
    </View>
  );
}

/** Today's three meal slots and what happened in each. */
export function SlotTimetable({ rows }: { rows: SlotRow[] }) {
  const home = useHomeColors();
  const shift = useShiftColors();

  return (
    <View
      style={{
        padding: 17,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: shift.cardBorder,
        backgroundColor: home.card,
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 1.5,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}>
      <AppText variant="title" accessibilityRole="header" style={{ color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 17, lineHeight: 25.5, paddingBottom: 12 }}>
        Today&apos;s slots
      </AppText>
      <View style={{ gap: 12 }}>
        {rows.map(({ slot, state }, index) => (
          <View
            key={slot.meal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingBottom: index < rows.length - 1 ? 13 : 0,
              borderBottomWidth: index < rows.length - 1 ? 1 : 0,
              borderBottomColor: shift.rowDivider,
            }}>
            <View style={{ flex: 1 }}>
              <AppText variant="title" style={{ color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 17.5 }}>
                {slot.meal}
              </AppText>
              <AppText variant="caption" style={{ color: shift.soft, fontSize: 12.5, lineHeight: 18.75, paddingTop: 2 }}>
                {slot.label}
              </AppText>
            </View>
            <SlotPill state={state} />
          </View>
        ))}
      </View>
      <AppText variant="caption" style={{ color: shift.soft, fontSize: 12, lineHeight: 18, paddingTop: 20 }}>
        Your pickup and delivery stops appear here once you are online.
      </AppText>
    </View>
  );
}
