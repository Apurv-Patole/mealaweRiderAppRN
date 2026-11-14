import type { StatusTone } from '@/theme/statusColors';

import type { PushEvent } from '@/services/push/notificationData';

/** How the event reached the app: it was open on screen, or the rider tapped the notification. */
export type PushSource = 'foreground' | 'opened';

export interface PushBanner {
  title: string;
  message: string;
  tone: StatusTone;
}

/** What the app does about one push event (pure, so it is tested without React Native). */
export interface PushReaction {
  /** Reload today's orders right away instead of waiting for the next poll. */
  refreshOrders: boolean;
  /** Short in-app notice, shown only when the app is already open. */
  banner: PushBanner | null;
  /** Screen to open when the rider tapped the notification. */
  route: '/(tabs)/orders' | '/(tabs)/route' | null;
}

const NO_REACTION: PushReaction = { refreshOrders: false, banner: null, route: null };

function bannerFor(event: PushEvent): PushBanner {
  switch (event.type) {
    case 'ORDER_ASSIGNED':
      return { title: 'New order', message: 'An order was assigned to you.', tone: 'assigned' };
    case 'ORDER_READY':
      return { title: 'Order ready', message: 'An order is ready for pickup.', tone: 'ready' };
    case 'ORDER_UPDATED':
      return { title: 'Order changed', message: orderLine('Order', event.orderNo, 'was updated.'), tone: 'ready' };
    case 'ORDER_CANCELLED_BY_USER':
      return {
        title: 'Order cancelled',
        message: orderLine('Order', event.orderNo, 'was cancelled by the customer. Do not deliver it.'),
        tone: 'cancelled',
      };
    case 'CANCEL_UPDATE':
      return {
        title: 'Cancel request',
        message: orderLine('Your request for order', event.orderNo, `was ${event.decision.toLowerCase() || 'reviewed'}.`),
        tone: 'ready',
      };
    case 'ATTENDANCE_REMINDER':
      return {
        title: 'Start your shift',
        message: event.mealSlot ? `Time to mark attendance for ${event.mealSlot}.` : 'Time to mark attendance.',
        tone: 'assigned',
      };
  }
}

function orderLine(prefix: string, orderNo: string, suffix: string): string {
  return orderNo ? `${prefix} #${orderNo} ${suffix}` : `${prefix} ${suffix}`;
}

/** Decides the app's response to a push event. */
export function reactToPush(event: PushEvent | null, source: PushSource): PushReaction {
  if (!event) return NO_REACTION;
  const route = event.type === 'ATTENDANCE_REMINDER' ? '/(tabs)/route' : '/(tabs)/orders';

  if (source === 'opened') {
    // The system already showed the notification; take the rider where it points, with fresh data.
    return { refreshOrders: event.type !== 'ATTENDANCE_REMINDER', banner: null, route };
  }
  return { refreshOrders: event.type !== 'ATTENDANCE_REMINDER', banner: bannerFor(event), route: null };
}
