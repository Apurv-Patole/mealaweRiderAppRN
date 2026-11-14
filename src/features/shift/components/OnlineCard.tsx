import { Power } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { dialog } from '@/components/dialog/dialog';
import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { pillOnlineSvg, alertTriangleSvg } from '@/features/route/ui/routeSvgSources';
import { formatClockFromIso } from '@/lib/dates';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { useShiftColors } from '../useShiftColors';

interface OnlineCardProps {
  mealSlot: string;
  startedAt: string;
  busy: boolean;
  onEndShift: () => void;
  /** One line about location sharing (on, last sent, waiting). */
  trackingText: string;
  /** A problem with location sharing, such as a missing permission. */
  trackingError: string | null;
}

/** Shown while a shift is running: an "Online" pill, a location alert when something is wrong, and End shift. */
export function OnlineCard({ mealSlot, startedAt, busy, onEndShift, trackingText, trackingError }: OnlineCardProps) {
  const home = useHomeColors();
  const shift = useShiftColors();
  const since = formatClockFromIso(startedAt);

  async function confirmEnd() {
    const confirmed = await dialog.confirm({
      title: 'End your shift?',
      message:
        'Location tracking stops and your incentive for this shift is calculated. You cannot start the same slot again.',
      icon: Power,
      tone: 'danger',
      confirmLabel: 'End shift',
      cancelLabel: 'Keep working',
    });
    if (confirmed) onEndShift();
  }

  return (
    <View style={{ padding: 16, gap: 16, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: shift.pillOpenBg }}>
          <SvgXml xml={pillOnlineSvg} width={14} height={14} />
          <AppText variant="caption" style={{ color: shift.pillInk, fontFamily: FONT_FAMILY.semibold, fontSize: 11.5, lineHeight: 17.25, letterSpacing: -0.287 }}>
            Online • {mealSlot}
          </AppText>
        </View>
        {!trackingError ? (
          <AppText variant="caption" style={{ color: home.muted, fontSize: 12, lineHeight: 18 }}>
            {since ? `On shift since ${since}. ` : ''}
            {trackingText}
          </AppText>
        ) : null}
      </View>

      {trackingError ? (
        <View
          accessibilityLiveRegion="polite"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: shift.alertBorder, backgroundColor: shift.alertBg }}>
          <SvgXml xml={alertTriangleSvg} width={20} height={20} />
          <AppText style={{ flex: 1, color: shift.alertInk, fontFamily: FONT_FAMILY.medium, fontSize: 13, lineHeight: 16.25 }}>{trackingError}</AppText>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="End shift"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={() => {
          haptics.tap();
          void confirmEnd();
        }}
        style={({ pressed }) => ({
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: shift.endShiftBg,
          opacity: busy ? 0.6 : pressed ? 0.88 : 1,
        })}>
        {busy ? (
          <ActivityIndicator color={shift.endShiftInk} />
        ) : (
          <AppText style={{ color: shift.endShiftInk, fontFamily: FONT_FAMILY.semibold, fontSize: 14, lineHeight: 21 }}>End shift</AppText>
        )}
      </Pressable>
    </View>
  );
}
