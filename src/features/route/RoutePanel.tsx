import { useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import { Bike } from 'lucide-react-native';
import { View } from 'react-native';

import { dialog } from '@/components/dialog/dialog';
import { AppText, Button, Card, StatusChip } from '@/components/ui';
import { OrderCard } from '@/features/orders/components/OrderCard';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { PickerPermissionError } from '@/features/register/documentPicker';
import { useShiftStore } from '@/features/shift/shiftStore';
import { useCurrentLocation } from '@/features/shift/useCurrentLocation';
import { pendingActions } from '@/features/trip/actionQueue';
import { useActionQueueStore } from '@/features/trip/actionQueueStore';
import { PendingBanner } from '@/features/trip/components/PendingBanner';
import { useRideStore } from '@/features/trip/rideStore';
import { startPickup, startRide } from '@/features/trip/tripActions';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { HttpError } from '@/services/http';
import { useAuthStore } from '@/store';
import { haptics } from '@/utils/haptics';

import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { useShiftColors } from '@/features/shift/useShiftColors';
import { FONT_FAMILY } from '@/theme';

import { NextUpCard } from './components/NextUpCard';
import { RouteMap } from './components/RouteMap';
import { StopRow } from './components/StopRow';
import { useLegRoute } from './useLegRoute';
import type { RouteStop } from './routePlanner';
import { customerStopsByDistance, formatRouteKm, planRoute, rideStarted, stageOf } from './routePlanner';
import { routeSummaryText } from './routeText';

function messageFor(error: unknown): string {
  if (error instanceof PickerPermissionError || error instanceof HttpError || error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * The run while the rider is online: where they are in it, the stops (pickups first, then deliveries
 * nearest-first), a map, orders that cannot be placed, and late carry-over orders. The rider picks up
 * at a kitchen (one photo for all its ready orders), starts the delivery ride, then delivers each stop.
 * Updates are saved first and sent when there is a connection (see features/trip).
 */
export function RoutePanel() {
  const home = useHomeColors();
  const shiftColors = useShiftColors();
  const isFocused = useIsFocused();
  const rider = useAuthStore((state) => state.rider);
  const shift = useShiftStore((state) => state.shift);
  const { lateOrders, loading, failed } = useOrdersStore();
  const orders = useEffectiveOrders();
  const queue = useActionQueueStore((state) => state.items);
  const savedRideShift = useRideStore((state) => state.startedShiftId);

  // The phone's position drives distances, the pickup check and the delivery order. Only while this tab is visible.
  const { location } = useCurrentLocation(isFocused);

  const [pickupBusy, setPickupBusy] = useState(false);
  const [rideBusy, setRideBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Orders for the shift's slot. If none are tagged with the slot, fall back to all of today's orders (as the Ionic app does).
  const slotOrders = useMemo(() => {
    const matching = orders.filter((order) => order.mealType === shift?.mealSlot);
    return matching.length > 0 ? matching : orders;
  }, [orders, shift?.mealSlot]);

  const plan = useMemo(() => planRoute(slotOrders, location), [slotOrders, location]);
  const rideIsOn = rideStarted(slotOrders, savedRideShift, shift?.id ?? null);
  const stage = stageOf(plan, slotOrders.length, rideIsOn);
  const visibleStops = stage === 'pickup' ? plan.stops : customerStopsByDistance(plan.stops, location);

  const nextStop = visibleStops[0] ?? null;
  const leg = useLegRoute(location, nextStop?.location ?? null, isFocused && !!shift);

  const kitchenStops = plan.stops.filter((stop) => stop.type === 'kitchen');
  const toCollect = kitchenStops.reduce((sum, stop) => sum + stop.orders.length, 0);
  const toDeliver = plan.stops.filter((stop) => stop.type === 'customer').length;
  const late = lateOrders.filter((order) => order.lifecycle === 'prePickup' || order.lifecycle === 'postPickup');
  const queuedOrderIds = useMemo(() => new Set(pendingActions(queue).map((action) => action.orderId)), [queue]);

  const context = rider && shift ? { rider, shift, location } : null;

  async function handlePickup(stop: RouteStop) {
    if (!context) return;
    setPickupBusy(true);
    setError(null);
    try {
      const queuedCount = await startPickup(stop, context);
      if (queuedCount > 0) haptics.confirm();
    } catch (caught: unknown) {
      haptics.error();
      setError(messageFor(caught));
    } finally {
      setPickupBusy(false);
    }
  }

  async function confirmStartRide() {
    const confirmed = await dialog.confirm({
      title: 'Start the delivery ride?',
      message: 'Customers are told their order is on the way. Make sure everything is picked up first.',
      icon: Bike,
      confirmLabel: 'Start ride',
      cancelLabel: 'Not yet',
    });
    if (confirmed) void beginRide();
  }

  async function beginRide() {
    if (!context) return;
    setRideBusy(true);
    setError(null);
    try {
      await startRide(context);
      haptics.confirm();
    } catch (caught: unknown) {
      haptics.error();
      setError(`Could not start the ride: ${messageFor(caught)}`);
    } finally {
      setRideBusy(false);
    }
  }

  async function retry() {
    if (rider) await useOrdersStore.getState().refresh(rider);
  }

  if (loading) {
    return (
      <Card>
        <AppText tone="muted">Loading your route…</AppText>
      </Card>
    );
  }

  const laterStops = visibleStops.slice(1);
  const summary = routeSummaryText(toCollect, toDeliver, formatRouteKm(plan.totalKm));

  return (
    <View className="gap-4">
      <PendingBanner />

      {failed ? (
        <Card className="gap-2">
          <StatusChip tone="ready" label="Offline?" />
          <AppText>We could not refresh your orders. The route below may be out of date.</AppText>
          <Button label="Try again" size="md" variant="outline" onPress={() => void retry()} />
        </Card>
      ) : null}

      {error ? (
        <Card className="border-danger">
          <AppText tone="danger">{error}</AppText>
        </Card>
      ) : null}

      {late.length > 0 ? (
        <View className="gap-3">
          <View className="gap-1">
            <AppText variant="h2">Deliver these first</AppText>
            <AppText tone="muted">Late orders from an earlier slot are still on your route.</AppText>
          </View>
          {late.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      ) : null}

      {nextStop ? (
        <NextUpCard
          stop={nextStop}
          stage={stage}
          riderLocation={location}
          route={leg.route}
          routeLoading={leg.loading}
          queuedOrderIds={queuedOrderIds}
          pickupBusy={pickupBusy}
          rideBusy={rideBusy}
          canDeliver={rideIsOn}
          onPickup={(target) => void handlePickup(target)}
          onStartRide={() => void confirmStartRide()}
        />
      ) : (
        <Card className="gap-2">
          <StatusChip tone={stage === 'complete' ? 'done' : 'offline'} label={stage === 'complete' ? 'All done' : 'No orders yet'} />
          <AppText>
            {stage === 'complete'
              ? 'Every order on your route is delivered or cancelled.'
              : 'No orders are assigned to you for this slot yet. Pull down to refresh.'}
          </AppText>
        </Card>
      )}

      {visibleStops.length > 0 ? (
        <RouteMap stops={visibleStops} riderLocation={location} route={leg.route?.points} height={220} />
      ) : null}

      {laterStops.length > 0 ? (
        <View style={{ gap: 12 }}>
          <View style={{ paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: home.border }}>
            <AppText variant="title" accessibilityRole="header" style={{ color: home.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 16, lineHeight: 24 }}>
              Then
            </AppText>
            {summary ? (
              <AppText variant="caption" style={{ color: shiftColors.soft, fontSize: 11, lineHeight: 16 }}>
                {summary}
              </AppText>
            ) : null}
          </View>
          <View style={{ padding: 16, gap: 16, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
            {laterStops.map((stop, index) => (
              <StopRow key={stop.id} stop={stop} position={index + 2} riderLocation={location} last={index === laterStops.length - 1} />
            ))}
          </View>
        </View>
      ) : null}

      {plan.skipped.length > 0 ? (
        <Card className="gap-2">
          <StatusChip tone="ready" label="Needs attention" />
          <AppText>
            {plan.skipped.length === 1 ? 'One order has' : `${plan.skipped.length} orders have`} no usable map location and
            cannot be placed on your route. Please tell Mealawe support:
          </AppText>
          {plan.skipped.map((order) => (
            <AppText key={order.orderId} tone="muted">
              #{order.orderNo}: {order.reason}
            </AppText>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
