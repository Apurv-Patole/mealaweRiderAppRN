import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useOrdersStore } from '@/features/orders/ordersStore';
import { useAuthStore } from '@/store';
import { haptics } from '@/utils/haptics';

import { usePushEventStore } from './pushEventStore';
import { usePushBannerStore } from './pushBannerStore';
import { reactToPush } from './pushReactions';

/**
 * Acts on every push event the app receives while a rider is signed in: reload the orders at once,
 * show a banner when the app is open, and open the right tab when a notification was tapped.
 * Mounted once, inside the signed-in part of the app.
 */
export function usePushReactions(): void {
  const router = useRouter();
  const eventId = usePushEventStore((state) => state.id);

  useEffect(() => {
    if (eventId === 0) return;
    const { last, source } = usePushEventStore.getState();
    const reaction = reactToPush(last, source);

    const rider = useAuthStore.getState().rider;
    if (reaction.refreshOrders && rider) void useOrdersStore.getState().refresh(rider);
    if (reaction.banner) {
      haptics.confirm();
      usePushBannerStore.getState().show(reaction.banner);
    }
    if (reaction.route) router.navigate(reaction.route);
  }, [eventId, router]);
}
