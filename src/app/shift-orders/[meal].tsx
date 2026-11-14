import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { OrderCard } from '@/features/orders/components/OrderCard';
import { backOrderSvg } from '@/features/orders/home/orderSvgSources';
import type { RiderOrder } from '@/features/orders/orderModel';
import { sortForList } from '@/features/orders/orderStats';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { MEAL_SLOTS, type MealSlot } from '@/features/shift/slots';
import { useAuthStore } from '@/store';
import { FONT_FAMILY } from '@/theme';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

const MIN_TOP_INSET = 24;

function asMeal(value: string | string[] | undefined): MealSlot {
  const text = Array.isArray(value) ? value[0] : value;
  return MEAL_SLOTS.find((meal) => meal === text) ?? 'Lunch';
}

/** All orders of one meal shift for the day chosen on Home (Figma "Lunch Order"). */
export default function ShiftOrdersScreen() {
  const homeColors = useHomeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meal: mealParam } = useLocalSearchParams<{ meal: string }>();
  const meal = asMeal(mealParam);
  const rider = useAuthStore((state) => state.rider);
  const loading = useOrdersStore((state) => state.loading);
  const orders = useEffectiveOrders();
  const [refreshing, setRefreshing] = useState(false);

  const list = sortForList(orders.filter((order) => order.mealType === meal));

  async function refresh() {
    if (!rider) return;
    setRefreshing(true);
    await useOrdersStore.getState().refresh(rider);
    setRefreshing(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: homeColors.canvas }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="auto" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: Math.max(insets.top, MIN_TOP_INSET), paddingHorizontal: 16 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: homeColors.border,
            backgroundColor: homeColors.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SvgXml xml={backOrderSvg} width={20} height={20} />
        </Pressable>
        <AppText variant="h1" accessibilityRole="header" style={{ color: homeColors.title, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 30, letterSpacing: -0.5 }}>
          {meal} order
        </AppText>
      </View>

      <FlashList<RiderOrder>
        data={list}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => (
          <View style={{ paddingBottom: 16 }}>
            <OrderCard order={item} />
          </View>
        )}
        ListEmptyComponent={
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: homeColors.border,
              backgroundColor: homeColors.card,
            }}>
            <AppText style={{ color: homeColors.muted, fontSize: 14, lineHeight: 22 }}>
              {loading ? 'Loading your orders…' : `No ${meal.toLowerCase()} orders for this day.`}
            </AppText>
          </View>
        }
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
