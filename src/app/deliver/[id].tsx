import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText, ChoiceChips } from '@/components/ui';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { PickerPermissionError } from '@/features/register/documentPicker';
import { useShiftStore } from '@/features/shift/shiftStore';
import { useCurrentLocation } from '@/features/shift/useCurrentLocation';
import { PhotoViewfinder } from '@/features/trip/components/PhotoViewfinder';
import { deliverySummaryLine, photoCaption } from '@/features/trip/deliverCopy';
import { deliveredNowParam } from '@/features/trip/deliveredModel';
import { canConfirmDelivery, HANDOVER_OPTIONS } from '@/features/trip/handOver';
import { confirmDeliveryPhoto, takeDeliveryPhoto, type DeliveryPhoto } from '@/features/trip/tripActions';
import { cameraSvg, confirmCircleSvg } from '@/features/trip/ui/deliverSvgSources';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { formatClock } from '@/lib/dates';
import { HttpError } from '@/services/http';
import { useAuthStore } from '@/store';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

function messageFor(error: unknown): string {
  if (error instanceof PickerPermissionError || error instanceof HttpError || error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/** A photo the rider has taken, with the moment it was taken (shown on the photo chip). */
interface Taken {
  photo: DeliveryPhoto;
  takenAt: Date;
}

/**
 * Delivery proof in two steps. First say how the food was handed over and take the photo; then review it and
 * confirm, or retake. Only "Confirm delivery" saves the update, which is then sent.
 */
export default function DeliverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const home = useHomeColors();
  const rider = useAuthStore((state) => state.rider);
  const shift = useShiftStore((state) => state.shift);
  const orders = useEffectiveOrders();
  const lateOrders = useOrdersStore((state) => state.lateOrders);
  const { location } = useCurrentLocation(true);

  const order = orders.find((candidate) => candidate.id === id) ?? lateOrders.find((candidate) => candidate.id === id);

  const [handOverTo, setHandOverTo] = useState('');
  const [taken, setTaken] = useState<Taken | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDeliver = order?.lifecycle === 'postPickup';
  const problem = !shift
    ? 'Start your shift before delivering.'
    : !order || !rider
      ? 'This order is no longer on your list. It may have been reassigned or cancelled.'
      : order.lifecycle === 'prePickup'
        ? 'This order has not been picked up yet.'
        : order.lifecycle === 'cancelled'
          ? 'This order was cancelled.'
          : !canDeliver
            ? 'This order is already delivered.'
            : null;

  async function takePhoto() {
    if (!order || !rider || !shift) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await takeDeliveryPhoto(order, handOverTo, { rider, shift, location });
      if (photo) setTaken({ photo, takenAt: new Date() });
    } catch (caught: unknown) {
      haptics.error();
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!taken || !order) return;
    setError(null);
    try {
      if (confirmDeliveryPhoto(taken.photo) > 0) {
        haptics.confirm();
        router.replace({ pathname: '/delivered/[id]', params: { id: order.id, at: deliveredNowParam() } });
      }
    } catch (caught: unknown) {
      haptics.error();
      setError(messageFor(caught));
    }
  }

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={4}
        onPress={() => router.back()}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: home.card, borderWidth: 1, borderColor: home.border }}>
        <ArrowLeft size={20} color={home.ink} />
      </Pressable>
      <AppText accessibilityRole="header" style={{ color: home.title, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 30, letterSpacing: -0.5 }}>
        Delivery photo
      </AppText>
    </View>
  );

  if (problem || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: home.canvas }}>
        <Stack.Screen options={{ headerShown: false }} />
        {header}
        <View style={{ margin: 16, padding: 17, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
          <AppText style={{ color: home.ink }}>{problem}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const clock = formatClock(taken?.takenAt ?? new Date());
  const hasPhoto = taken !== null;
  const needsHandOver = !hasPhoto && !canConfirmDelivery(handOverTo);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: home.canvas }}>
      <Stack.Screen options={{ headerShown: false }} />
      {header}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <PhotoViewfinder photoUri={taken?.photo.photoUri ?? null} caption={photoCaption(clock, order.customer)} />

        <View style={{ gap: 4, padding: 17, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
          <AppText variant="caption" style={{ color: home.muted, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 16 }}>
            Delivering to
          </AppText>
          <AppText style={{ color: home.title, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24, letterSpacing: -0.4 }}>
            {order.customer.name}
          </AppText>
          <AppText variant="caption" style={{ color: home.muted, fontSize: 12, lineHeight: 20 }}>
            {deliverySummaryLine(order.orderNo, order.customer.address)}
          </AppText>
        </View>

        {hasPhoto ? null : (
          <ChoiceChips label="How was it handed over?" options={HANDOVER_OPTIONS} value={handOverTo} onChange={setHandOverTo} />
        )}

        {error ? (
          <View accessibilityLiveRegion="polite" style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
            <AppText tone="danger">{error}</AppText>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ gap: 16, alignItems: 'stretch', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, backgroundColor: home.canvas }}>
        {hasPhoto ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm delivery"
              onPress={confirm}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: home.green,
                opacity: pressed ? 0.88 : 1,
              })}>
              <SvgXml xml={confirmCircleSvg} width={20} height={20} raw />
              <AppText style={{ color: home.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Confirm delivery</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={() => void takePhoto()}
              style={({ pressed }) => ({ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, opacity: busy ? 0.5 : pressed ? 0.7 : 1 })}>
              {busy ? <ActivityIndicator color={home.greenInk} /> : <SvgXml xml={cameraSvg} width={16} height={16} />}
              <AppText style={{ color: home.greenInk, fontFamily: FONT_FAMILY.semibold, fontSize: 14, lineHeight: 20 }}>Retake photo</AppText>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              accessibilityState={{ disabled: busy || needsHandOver, busy }}
              disabled={busy || needsHandOver}
              onPress={() => void takePhoto()}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: home.green,
                opacity: busy || needsHandOver ? 0.5 : pressed ? 0.88 : 1,
              })}>
              {busy ? <ActivityIndicator color={home.onGreen} /> : null}
              <AppText style={{ color: home.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Take photo</AppText>
            </Pressable>
            {needsHandOver ? (
              <AppText variant="caption" style={{ color: home.muted, textAlign: 'center' }}>
                Choose how it was handed over first.
              </AppText>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
