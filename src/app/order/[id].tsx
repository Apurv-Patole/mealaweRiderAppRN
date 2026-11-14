import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bike, MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dialog } from '@/components/dialog/dialog';
import { AppText } from '@/components/ui';
import { env } from '@/config';
import { ItemsCard } from '@/features/orders/components/ItemsCard';
import { NextStepCard } from '@/features/orders/components/NextStepCard';
import { OrderProgress } from '@/features/orders/components/OrderProgress';
import { ProofCard } from '@/features/orders/components/ProofCard';
import { RouteCard } from '@/features/orders/components/RouteCard';
import { RoutePreviewCard } from '@/features/orders/components/RoutePreviewCard';
import { bannerCheckSvg, calendarSvg, doubleCheckSvg, lightModeSvg, pickupPointSvg, repeatSvg, startDeliverySvg } from '@/features/orders/home/detailSvgSources';
import { backOrderSvg } from '@/features/orders/home/orderSvgSources';
import { isReadyForPickup } from '@/features/orders/lifecycle';
import { orderTitle, orderTypeLabel, pickupBlockReason } from '@/features/orders/orderDetailModel';
import { currentStep, stepTimeIso } from '@/features/orders/orderProgress';
import { useOrdersStore } from '@/features/orders/ordersStore';
import type { RouteStop } from '@/features/route/routePlanner';
import { useShiftStore } from '@/features/shift/shiftStore';
import { useCurrentLocation } from '@/features/shift/useCurrentLocation';
import { useActionQueueStore } from '@/features/trip/actionQueueStore';
import { hasActionFor } from '@/features/trip/actionQueue';
import { startPickup, startRide } from '@/features/trip/tripActions';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { haversineMeters } from '@/lib/geo';
import { useAuthStore } from '@/store';
import { haptics } from '@/utils/haptics';
import { formatClockFromIso, formatLongDate } from '@/lib/dates';
import { FONT_FAMILY } from '@/theme';
import { useDetailColors, useHomeColors } from '@/features/orders/home/useHomeColors';

const MIN_TOP_INSET = 24;

function Header({ title, onBack, topInset }: { title: string; onBack: () => void; topInset: number }) {
  const C = useHomeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: Math.max(topInset, MIN_TOP_INSET), paddingHorizontal: 16, paddingBottom: 16 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
        <SvgXml xml={backOrderSvg} width={20} height={20} />
      </Pressable>
      <AppText variant="h1" accessibilityRole="header" numberOfLines={1} style={{ flex: 1, color: C.title, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 30, letterSpacing: -0.5 }}>
        {title}
      </AppText>
    </View>
  );
}

/** A white pill with a small icon: the delivery date, the meal, or the order type. */
function ScheduleTag({ iconXml, size, label }: { iconXml: string; size: number; label: string }) {
  const D = useDetailColors();
  const C = useHomeColors();
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
      <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
        <SvgXml xml={iconXml} width={size} height={size} />
      </View>
      <AppText variant="caption" style={{ color: D.tagInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18 }}>
        {label}
      </AppText>
    </View>
  );
}

/** One order: progress, the next step, the pickup and drop-off, schedule tags, items, and the action bar. */
export default function OrderDetailScreen() {
  const D = useDetailColors();
  const C = useHomeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The overlay orders show a waiting pickup or delivery as already done.
  const orders = useEffectiveOrders();
  const lateOrders = useOrdersStore((state) => state.lateOrders);
  const order = orders.find((candidate) => candidate.id === id) ?? lateOrders.find((candidate) => candidate.id === id);
  const rider = useAuthStore((state) => state.rider);
  const shift = useShiftStore((state) => state.shift);
  const queue = useActionQueueStore((state) => state.items);
  // The phone's position, for the kitchen proximity check on pickup. Only while this order is on screen.
  const { location } = useCurrentLocation(true);
  const [pickupBusy, setPickupBusy] = useState(false);
  const [rideBusy, setRideBusy] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: C.canvas }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="auto" />
        <Header title="Order" onBack={() => router.back()} topInset={insets.top} />
        <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
          <AppText style={{ color: C.ink, fontSize: 14, lineHeight: 22 }}>
            This order is no longer on your list. It may have been reassigned or cancelled.
          </AppText>
        </View>
      </View>
    );
  }

  const active = order.lifecycle === 'prePickup' || order.lifecycle === 'postPickup';
  const orderDate = order.orderDate ? formatLongDate(new Date(order.orderDate)) : '';
  const typeLabel = orderTypeLabel(order.orderType);
  const step = currentStep(order);
  const pickedUpAt = formatClockFromIso(stepTimeIso(order, 3) ?? '');
  const canStartRide = order.lifecycle === 'postPickup' && step === 3;
  const canDeliver = order.lifecycle === 'postPickup' && step >= 4;
  const canPickUp = order.lifecycle === 'prePickup' && isReadyForPickup(order.statusKey) && !hasActionFor(queue, order.id, 'pickup');

  async function completePickup() {
    if (!order || !rider || pickupBusy) return;
    const distanceM = location && order.kitchen.location ? haversineMeters(location, order.kitchen.location) : null;
    const blocked = pickupBlockReason({
      hasShift: shift !== null,
      riderLocation: location,
      kitchenLocation: order.kitchen.location,
      proximityM: env.kitchenProximityMeters,
      distanceM,
    });
    if (blocked || !shift) {
      void dialog.error({ title: 'Cannot complete the pickup yet', message: blocked ?? 'Start your shift on the Route tab first.' });
      return;
    }
    // A one-order kitchen stop: the same pickup the Route tab starts, with its photo and queued update.
    const stop: RouteStop = {
      id: `kitchen-${order.id}`,
      type: 'kitchen',
      location: order.kitchen.location ?? location ?? { lat: 0, lng: 0 },
      name: order.kitchen.name,
      subtitle: order.kitchen.address,
      orders: [order],
      distanceFromPrevKm: null,
      distanceFromRiderKm: distanceM !== null ? distanceM / 1000 : null,
    };
    setPickupBusy(true);
    try {
      const queued = await startPickup(stop, { rider, shift, location });
      if (queued > 0) haptics.confirm();
    } catch (caught: unknown) {
      haptics.error();
      void dialog.error({
        title: 'Pickup not saved',
        message: caught instanceof Error ? caught.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setPickupBusy(false);
    }
  }

  async function confirmStartRide() {
    if (!rider || !shift || rideBusy) {
      void dialog.error({ title: 'Cannot start yet', message: 'Start your shift on the Route tab first.' });
      return;
    }
    const confirmed = await dialog.confirm({
      title: 'Start the delivery ride?',
      message: 'Customers are told their order is on the way. Make sure everything is picked up first.',
      icon: Bike,
      confirmLabel: 'Start ride',
      cancelLabel: 'Not yet',
    });
    if (!confirmed) return;
    setRideBusy(true);
    try {
      await startRide({ rider, shift, location });
      haptics.confirm();
    } catch (caught: unknown) {
      haptics.error();
      void dialog.error({
        title: 'Could not start the ride',
        message: caught instanceof Error ? caught.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setRideBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="auto" />
      <Header title={orderTitle(order)} onBack={() => router.back()} topInset={insets.top} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <OrderProgress order={order} />
        <ProofCard order={order} />
        <NextStepCard order={order} />
        {order.lifecycle === 'postPickup' ? (
          <View
            accessibilityLiveRegion="polite"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: D.confirmBorder, backgroundColor: C.completedBg }}>
            <SvgXml xml={bannerCheckSvg} width={16} height={16} />
            <AppText style={{ flex: 1, color: D.confirmInk, fontFamily: FONT_FAMILY.semibold, fontSize: 13, lineHeight: 16 }}>
              {pickedUpAt ? `Pickup photo saved at ${pickedUpAt}.` : 'Pickup photo saved.'}
            </AppText>
          </View>
        ) : null}
        {canDeliver ? <RoutePreviewCard order={order} riderLocation={location} /> : null}
        <RouteCard order={order} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {orderDate ? <ScheduleTag iconXml={calendarSvg} size={12.67} label={orderDate} /> : null}
          {order.mealType ? <ScheduleTag iconXml={lightModeSvg} size={14} label={order.mealType} /> : null}
          {typeLabel ? <ScheduleTag iconXml={repeatSvg} size={14} label={typeLabel} /> : null}
        </View>

        {order.specialRequest ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
            <MessageSquare size={16} color={D.subtle} style={{ marginTop: 2 }} />
            <AppText style={{ flex: 1, color: C.ink, fontSize: 14, lineHeight: 21 }}>{order.specialRequest}</AppText>
          </View>
        ) : null}

        <ItemsCard order={order} />
      </ScrollView>

      {active ? (
        <View style={{ alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: C.canvas }}>
          {canPickUp ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Complete Pickup"
              accessibilityState={{ disabled: pickupBusy, busy: pickupBusy }}
              disabled={pickupBusy}
              onPress={() => {
                haptics.tap();
                void completePickup();
              }}
              style={({ pressed }) => ({
                alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: C.green,
                opacity: pickupBusy ? 0.6 : pressed ? 0.88 : 1,
              })}>
              {pickupBusy ? <ActivityIndicator color={C.onGreen} /> : <SvgXml xml={pickupPointSvg} width={20} height={20} />}
              <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Complete Pickup</AppText>
            </Pressable>
          ) : null}
          {canStartRide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start Delivery"
              accessibilityState={{ disabled: rideBusy, busy: rideBusy }}
              disabled={rideBusy}
              onPress={() => {
                haptics.tap();
                void confirmStartRide();
              }}
              style={({ pressed }) => ({
                alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: C.green,
                opacity: rideBusy ? 0.6 : pressed ? 0.88 : 1,
              })}>
              {rideBusy ? <ActivityIndicator color={C.onGreen} /> : <SvgXml xml={startDeliverySvg} width={20} height={20} />}
              <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Start Delivery</AppText>
            </Pressable>
          ) : null}
          {canDeliver ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark Delivered"
              onPress={() => router.push({ pathname: '/deliver/[id]', params: { id: order.id } })}
              style={({ pressed }) => ({
                alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: C.green,
                opacity: pressed ? 0.88 : 1,
              })}>
              <SvgXml xml={doubleCheckSvg} width={20} height={20} />
              <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Mark Delivered</AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cannot deliver? Ask admin"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/cancel/[id]', params: { id: order.id } })}
            style={{ paddingVertical: 4, minHeight: 32, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ color: C.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21 }}>Cannot deliver? Ask admin</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
