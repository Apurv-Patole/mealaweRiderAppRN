import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, StatusChip } from '@/components/ui';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { useShiftStore } from '@/features/shift/shiftStore';
import { IncentiveCard } from '@/features/wallet/components/IncentiveCard';
import { fetchIncentives } from '@/features/wallet/walletApi';
import { formatDuration, incentiveForShift, type IncentiveRecord } from '@/features/wallet/walletModel';
import { useWalletStore } from '@/features/wallet/walletStore';
import { formatClockFromIso } from '@/lib/dates';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

/**
 * Shown right after End Shift: how long, how far, how many deliveries, and the incentive. The server works the
 * incentive out when the shift ends, so it can take a moment; the rider can check again.
 */
export default function ShiftSummaryScreen() {
  const router = useRouter();
  const ended = useShiftStore((state) => state.lastEnded);
  const orders = useOrdersStore((state) => state.orders);
  // The time the summary was opened, used when the server did not send an end time.
  const [openedAt] = useState(() => Date.now());
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; record: IncentiveRecord | null } | null>(null);

  const shiftId = ended?.id;
  const key = `${shiftId ?? ''}|${attempt}`;
  // "Checking" is derived: nothing has loaded for this shift and attempt yet.
  const checking = loaded?.key !== key;
  const incentive = loaded?.key === key ? loaded.record : null;

  useEffect(() => {
    if (!shiftId) return;
    let cancelled = false;
    fetchIncentives()
      .then((records) => {
        if (!cancelled) setLoaded({ key, record: incentiveForShift(records, shiftId) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, record: null });
      });
    return () => {
      cancelled = true;
    };
  }, [shiftId, key]);

  function done() {
    useShiftStore.getState().clearLastEnded();
    void useWalletStore.getState().loadIncentives();
    router.replace('/(tabs)/route');
  }

  if (!ended) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Card className="gap-3">
          <AppText>There is no finished shift to show.</AppText>
          <Button label="Back to route" onPress={() => router.replace('/(tabs)/route')} />
        </Card>
      </Screen>
    );
  }

  const startMs = new Date(ended.startedAt).getTime();
  const endMs = ended.endedAt ? new Date(ended.endedAt).getTime() : openedAt;
  const delivered = orders.filter((order) => order.mealType === ended.mealSlot && order.lifecycle === 'done').length;

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="gap-2">
        <StatusChip tone="done" label="Shift complete" />
        <AppText variant="h1">{ended.mealSlot} shift done</AppText>
        <AppText tone="muted">
          {formatClockFromIso(ended.startedAt)} to {formatClockFromIso(new Date(endMs).toISOString())}
        </AppText>
      </View>

      <Card className="flex-row">
        <Stat value={formatDuration(endMs - startMs)} label="On shift" />
        <Stat value={`${ended.totalActualKm.toFixed(1)} km`} label="Travelled" />
        <Stat value={String(delivered)} label="Delivered" />
      </Card>

      {incentive ? (
        <IncentiveCard record={incentive} />
      ) : (
        <Card className="gap-3">
          <AppText variant="title">Your incentive</AppText>
          <AppText tone="muted">
            {checking
              ? 'Working out your incentive…'
              : 'Your incentive is still being worked out. It will appear in Wallet under Incentives, and is added to your wallet after 7 days.'}
          </AppText>
          {!checking ? <Button label="Check again" size="md" variant="outline" onPress={() => setAttempt((count) => count + 1)} /> : null}
        </Card>
      )}

      <Button label="Done" onPress={done} />
    </Screen>
  );
}
