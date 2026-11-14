import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, StatusChip } from '@/components/ui';
import { DemoBannerInline } from '@/features/demo';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';
import { RoutePanel } from '@/features/route/RoutePanel';
import { AttendanceCard } from '@/features/shift/components/AttendanceCard';
import { OnlineCard } from '@/features/shift/components/OnlineCard';
import { SlotTimetable } from '@/features/shift/components/SlotTimetable';
import { useShiftStore } from '@/features/shift/shiftStore';
import { useShiftScreen } from '@/features/shift/useShiftScreen';
import { useTrackingStatusStore } from '@/features/tracking/trackingStatusStore';
import { useTrackingText } from '@/features/tracking/useTrackingText';
import { formatLongDate } from '@/lib/dates';
import { useAuthStore } from '@/store';
import { FONT_FAMILY } from '@/theme';

export default function RouteScreen() {
  const home = useHomeColors();
  const register = useRegisterColors();
  const router = useRouter();
  const routeNo = useAuthStore((state) => state.rider?.routeNo);
  const shift = useShiftScreen();
  const trackingText = useTrackingText();
  const trackingError = useTrackingStatusStore((state) => state.error);

  /** Ends the shift, then shows the summary (only if the server really ended it). */
  async function endAndSummarise() {
    await shift.endShift();
    if (useShiftStore.getState().lastEnded) router.push('/shift-summary');
  }

  return (
    <Screen onRefresh={() => void shift.reload()} refreshing={shift.refreshing}>
      <View style={{ gap: 4 }}>
        <AppText variant="h1" accessibilityRole="header" style={{ color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 32, letterSpacing: -0.6 }}>
          Route
        </AppText>
        <AppText style={{ color: register.body, fontSize: 14, lineHeight: 20 }}>
          {formatLongDate(shift.now)}
          {routeNo ? ' • ' : ''}
          {routeNo ? <AppText style={{ color: register.body, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>Route {routeNo}</AppText> : null}
        </AppText>
      </View>

      <DemoBannerInline />

      {shift.refreshFailed ? (
        <Card className="gap-2">
          <StatusChip tone="ready" label="Offline?" />
          <AppText>We could not check your shift. What you see may be out of date.</AppText>
          <Button label="Try again" size="md" variant="outline" onPress={() => void shift.reload()} />
        </Card>
      ) : null}

      {shift.error ? (
        <Card className="border-danger">
          <AppText tone="danger">{shift.error}</AppText>
        </Card>
      ) : null}

      {shift.loading ? (
        <Card>
          <AppText tone="muted">Checking your shift…</AppText>
        </Card>
      ) : shift.gate.kind === 'online' && shift.shiftSlotLabel && shift.startedAt ? (
        <OnlineCard
          mealSlot={shift.shiftSlotLabel}
          startedAt={shift.startedAt}
          busy={shift.busy}
          onEndShift={() => void endAndSummarise()}
          trackingText={trackingText}
          trackingError={trackingError}
        />
      ) : (
        <AttendanceCard
          gate={shift.gate}
          slot={shift.currentSlot}
          nextOpening={shift.nextOpening}
          proximityM={shift.proximityM}
          busy={shift.busy}
          onTakeAttendance={() => void shift.takeAttendance()}
        />
      )}

      {shift.gate.kind === 'online' ? (
        <RoutePanel />
      ) : (
        <>
          <SlotTimetable rows={shift.timetable} />
        </>
      )}
    </Screen>
  );
}
