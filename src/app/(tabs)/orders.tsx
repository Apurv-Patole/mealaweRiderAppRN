import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { AppText, Button, Card, StatusChip } from '@/components/ui';
import { DemoBannerInline } from '@/features/demo';
import { DateStrip } from '@/features/orders/components/DateStrip';
import { HomeHeader } from '@/features/orders/components/HomeHeader';
import { ShiftBar } from '@/features/orders/components/ShiftBar';
import { ShiftCard } from '@/features/orders/components/ShiftCard';
import { StatsGrid } from '@/features/orders/components/StatsGrid';
import { deliveryDateOptions } from '@/features/orders/deliveryDate';
import { activeMealName, shiftStatusLine } from '@/features/orders/home/homeHeaderModel';
import { statsBySlot } from '@/features/orders/orderStats';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { slotPhase } from '@/features/orders/slotPhase';
import { isShiftOnline } from '@/features/shift/shiftModel';
import { useShiftStore } from '@/features/shift/shiftStore';
import { PendingBanner } from '@/features/trip/components/PendingBanner';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { useAuthStore } from '@/store';
import { FONT_FAMILY } from '@/theme';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

const DATE_CHOICES = 4;

/** Home: who is riding, the day's numbers, and the three meal shifts. Tapping a shift opens its orders. */
export default function HomeScreen() {
  const homeColors = useHomeColors();
  const router = useRouter();
  const rider = useAuthStore((state) => state.rider);
  const slots = useShiftStore((state) => state.slots);
  const shift = useShiftStore((state) => state.shift);
  const { failed, dateOffset, setDateOffset } = useOrdersStore();
  const orders = useEffectiveOrders();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const dateOptions = deliveryDateOptions(now, DATE_CHOICES);

  const stats = statsBySlot(orders);
  const activeMeal = activeMealName(slots, now, dateOffset);
  const online = isShiftOnline(shift);

  async function refresh() {
    if (!rider) return;
    setRefreshing(true);
    await Promise.all([useOrdersStore.getState().refresh(rider), useShiftStore.getState().refresh(rider)]);
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: homeColors.canvas }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={homeColors.green}
          colors={[homeColors.green]}
          progressBackgroundColor={homeColors.card}
        />
      }
    >
      <HomeHeader rider={rider} statusText={shiftStatusLine(online, activeMeal)} live={online || activeMeal !== null} />

      <View className="gap-4 px-4" style={{ marginTop: 16 }}>
        <DemoBannerInline />

        <DateStrip options={dateOptions} selectedOffset={dateOffset} onSelect={setDateOffset} />

        <PendingBanner />

        {failed ? (
          <Card className="gap-2">
            <StatusChip tone="ready" label="Offline?" />
            <AppText>We could not refresh your orders. What you see may be out of date.</AppText>
            <Button label="Try again" size="md" variant="outline" onPress={() => void refresh()} />
          </Card>
        ) : null}

        {!rider?.routeNo ? (
          <Card>
            <AppText>You do not have a delivery route assigned. Please contact Mealawe support.</AppText>
          </Card>
        ) : null}

        {online ? <ShiftBar shift={shift} now={now} /> : null}

        <StatsGrid stats={stats} distanceKm={shift?.totalActualKm ?? 0} />

        <AppText
          variant="title"
          accessibilityRole="header"
          style={{ color: homeColors.title, fontFamily: FONT_FAMILY.bold, fontSize: 18, lineHeight: 28, letterSpacing: -0.45, marginBottom: -8 }}>
          Shifts
        </AppText>
        {slots.map((slot) => {
          const stat = stats.find((candidate) => candidate.meal === slot.meal);
          if (!stat) return null;
          return (
            <ShiftCard
              key={slot.meal}
              slot={slot}
              stat={stat}
              phase={slotPhase(slot, now, dateOffset)}
              onPress={() =>
                router.push({
                  pathname: '/shift-orders/[meal]',
                  params: { meal: slot.meal },
                })
              }
            />
          );
        })}
      </View>
    </ScrollView>
  );
}
