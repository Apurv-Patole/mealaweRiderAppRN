import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { useStatusColors } from '@/theme';

import { formatRupees } from '../orderModel';
import type { SlotStat } from '../orderStats';

interface SlotStatsCardProps {
  stat: SlotStat;
  /** The slot whose window is open (or nearest). */
  highlighted: boolean;
}

function Figure({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 rounded-xl bg-muted py-2">
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

/** Progress for one meal slot: how many orders, how many delivered, and what has been earned. */
export function SlotStatsCard({ stat, highlighted }: SlotStatsCardProps) {
  const bar = useStatusColors('done');
  const track = useStatusColors('offline');

  return (
    <Card className={`gap-3 ${highlighted ? 'border-primary' : ''}`}>
      <View className="flex-row items-center justify-between">
        <AppText variant="title">{stat.meal}</AppText>
        <AppText variant="caption" tone="muted">
          {stat.total === 0 ? 'No orders' : `${stat.done} of ${stat.total} delivered`}
        </AppText>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: stat.progressPct }}
        style={{ height: 10, borderRadius: 5, backgroundColor: track.soft, overflow: 'hidden' }}>
        <View style={{ height: 10, borderRadius: 5, width: `${stat.progressPct}%`, backgroundColor: bar.fill }} />
      </View>
      <View className="flex-row gap-2">
        <Figure value={stat.pending} label="To do" />
        <Figure value={stat.pickedUp} label="Picked up" />
        <Figure value={stat.kitchens} label="Kitchens" />
        <Figure value={formatRupees(stat.income)} label="Order value" />
      </View>
    </Card>
  );
}
