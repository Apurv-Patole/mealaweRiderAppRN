import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, StatusChip } from '@/components/ui';
import type { RiderShift } from '@/features/shift/shiftModel';
import { fetchShiftHistory } from '@/features/wallet/walletApi';
import { formatDuration, formatShortDate } from '@/features/wallet/walletModel';
import { formatClockFromIso } from '@/lib/dates';
import { useAuthStore } from '@/store';

export default function AttendanceHistoryScreen() {
  const riderId = useAuthStore((state) => state.rider?.riderId);
  const [shifts, setShifts] = useState<RiderShift[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    fetchShiftHistory(riderId)
      .then((result) => {
        if (!cancelled) {
          setShifts(result);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [riderId, attempt]);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Attendance history' }} />

      {failed ? (
        <Card className="gap-2">
          <AppText>We could not load your attendance.</AppText>
          <Button label="Try again" size="md" variant="outline" onPress={() => setAttempt((count) => count + 1)} />
        </Card>
      ) : shifts === null ? (
        <Card>
          <AppText tone="muted">Loading…</AppText>
        </Card>
      ) : shifts.length === 0 ? (
        <Card>
          <AppText tone="muted">No shifts yet. Your attendance appears here after you start one.</AppText>
        </Card>
      ) : (
        shifts.map((shift) => {
          const endMs = shift.endedAt ? new Date(shift.endedAt).getTime() : null;
          const startMs = new Date(shift.startedAt).getTime();
          return (
            <Card key={shift.id} className="gap-1">
              <View className="flex-row items-center justify-between gap-3">
                <AppText variant="title">
                  {formatShortDate(shift.date)} · {shift.mealSlot}
                </AppText>
                <StatusChip tone={shift.status === 'online' ? 'assigned' : 'done'} label={shift.status === 'online' ? 'Online' : 'Worked'} />
              </View>
              <AppText tone="muted">
                {formatClockFromIso(shift.startedAt)}
                {shift.endedAt ? ` to ${formatClockFromIso(shift.endedAt)}` : ''}
                {endMs !== null && endMs > startMs ? ` · ${formatDuration(endMs - startMs)}` : ''}
                {shift.totalActualKm > 0 ? ` · ${shift.totalActualKm.toFixed(1)} km` : ''}
              </AppText>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
