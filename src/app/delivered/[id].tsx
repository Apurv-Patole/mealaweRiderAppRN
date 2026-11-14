import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { OrderProgress } from '@/features/orders/components/OrderProgress';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { orderTitle } from '@/features/orders/orderDetailModel';
import { planRoute } from '@/features/route/routePlanner';
import { useCurrentLocation } from '@/features/shift/useCurrentLocation';
import { DeliveredBadge } from '@/features/trip/components/DeliveredBadge';
import { deliveredAtIso, nextStopLine, nextStopOf } from '@/features/trip/deliveredModel';
import { nextStopPinSvg, sendCheckSvg } from '@/features/trip/ui/deliveredSvgSources';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { formatClockFromIso } from '@/lib/dates';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

/** What the rider sees right after confirming a delivery: it is done, and where to go next. */
export default function DeliveredScreen() {
  const { id, at } = useLocalSearchParams<{ id: string; at?: string }>();
  const router = useRouter();
  const home = useHomeColors();
  const orders = useEffectiveOrders();
  const lateOrders = useOrdersStore((state) => state.lateOrders);
  const { location } = useCurrentLocation(true);

  const order = orders.find((candidate) => candidate.id === id) ?? lateOrders.find((candidate) => candidate.id === id);
  const deliveredAt = deliveredAtIso(at);
  const nextStop = nextStopOf(planRoute(orders, location).stops);

  function leave() {
    haptics.tap();
    router.replace(nextStop ? '/(tabs)/route' : '/(tabs)/orders');
  }

  const time = formatClockFromIso(deliveredAt ?? '');
  const who = [order?.customer.name, time].filter(Boolean).join('  ·  ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: home.canvas }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to orders"
          hitSlop={4}
          onPress={() => router.replace('/(tabs)/orders')}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: home.card, borderWidth: 1, borderColor: home.border }}>
          <ArrowLeft size={20} color={home.ink} />
        </Pressable>
        <AppText accessibilityRole="header" numberOfLines={1} style={{ flex: 1, color: home.title, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 30, letterSpacing: -0.5 }}>
          {order ? orderTitle(order) : 'Order'}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`Delivered${who ? `, ${who}` : ''}`} style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 8 }}>
          <DeliveredBadge />
          <AppText style={{ marginTop: 16, color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 28, lineHeight: 28, letterSpacing: -0.7 }}>Delivered</AppText>
          {who ? (
            <AppText style={{ marginTop: 8, color: home.muted, fontFamily: FONT_FAMILY.medium, fontSize: 15, lineHeight: 22.5 }}>{who}</AppText>
          ) : null}
        </View>

        {order ? <OrderProgress order={order} deliveredAt={deliveredAt} /> : null}

        {nextStop ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: home.dropoffTile }}>
              <SvgXml xml={nextStopPinSvg} width={15} height={18} raw />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" style={{ color: home.muted, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 15 }}>Next stop</AppText>
              <AppText numberOfLines={1} style={{ marginTop: 2, color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24, letterSpacing: -0.4 }}>
                {nextStop.name}
              </AppText>
              <AppText variant="caption" style={{ marginTop: 2, color: home.muted, fontSize: 13, lineHeight: 16.25 }}>{nextStopLine(nextStop)}</AppText>
            </View>
          </View>
        ) : (
          <View style={{ padding: 17, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
            <AppText style={{ color: home.muted, fontSize: 14, lineHeight: 21 }}>No more stops on your route. Nice work.</AppText>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, backgroundColor: home.canvas }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nextStop ? 'Go to next stop' : 'Back to orders'}
          onPress={leave}
          style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 12, borderRadius: 12, backgroundColor: home.green, opacity: pressed ? 0.88 : 1 })}>
          {nextStop ? <SvgXml xml={sendCheckSvg} width={20} height={20} raw /> : null}
          <AppText style={{ color: home.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>
            {nextStop ? 'Go to next stop' : 'Back to orders'}
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
