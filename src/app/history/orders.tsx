import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, StatusChip } from '@/components/ui';
import { formatRupees, statusLabel, statusTone, type RiderOrder } from '@/features/orders/orderModel';
import { fetchOrderHistory } from '@/features/wallet/walletApi';
import { formatShortDate } from '@/features/wallet/walletModel';
import { useAuthStore } from '@/store';

export default function OrderHistoryScreen() {
  const riderId = useAuthStore((state) => state.rider?.riderId);
  const [orders, setOrders] = useState<RiderOrder[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!riderId) return;
    let cancelled = false;
    fetchOrderHistory(riderId)
      .then((result) => {
        if (!cancelled) {
          setOrders(result);
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
      <Stack.Screen options={{ headerShown: true, title: 'Order history' }} />

      {failed ? (
        <Card className="gap-2">
          <AppText>We could not load your orders.</AppText>
          <Button label="Try again" size="md" variant="outline" onPress={() => setAttempt((count) => count + 1)} />
        </Card>
      ) : orders === null ? (
        <Card>
          <AppText tone="muted">Loading…</AppText>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <AppText tone="muted">No past orders yet.</AppText>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="gap-1">
            <View className="flex-row items-center justify-between gap-3">
              <AppText variant="title">#{order.orderNo}</AppText>
              <StatusChip tone={statusTone(order)} label={statusLabel(order)} />
            </View>
            <AppText>
              {order.kitchen.name} to {order.customer.name}
            </AppText>
            <AppText variant="caption" tone="muted">
              {[formatShortDate(order.orderDate), order.mealType, formatRupees(order.totalAmount)].filter(Boolean).join(' · ')}
            </AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}
