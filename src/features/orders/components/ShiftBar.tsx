import { Clock, Gauge } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import type { RiderShift } from '@/features/shift/shiftModel';
import { formatClockFromIso } from '@/lib/dates';
import { formatDuration } from '@/features/wallet/walletModel';
import { useColors } from '@/theme';

interface ShiftBarProps {
  shift: RiderShift;
  now: Date;
}

/** Shown while a shift is running, like the old app's live bar: distance travelled and time on shift. */
export function ShiftBar({ shift, now }: ShiftBarProps) {
  const colors = useColors();
  const startedMs = new Date(shift.startedAt).getTime();
  const onShift = Number.isFinite(startedMs) ? formatDuration(Math.max(0, now.getTime() - startedMs)) : '';

  return (
    <Card className="flex-row items-center justify-between gap-3 p-3">
      <View className="flex-row items-center gap-2">
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
        <Gauge size={18} color={colors.primary} />
        <AppText variant="label">{shift.totalActualKm.toFixed(1)} km travelled</AppText>
      </View>
      <View className="flex-row items-center gap-1">
        <Clock size={14} color={colors.mutedForeground} />
        <AppText variant="caption" tone="muted">
          {onShift ? `${onShift} on shift` : `Since ${formatClockFromIso(shift.startedAt)}`}
        </AppText>
      </View>
    </Card>
  );
}
