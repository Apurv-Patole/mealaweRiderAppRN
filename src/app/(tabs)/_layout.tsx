import { Redirect, usePathname } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { DemoBanner } from '@/features/demo';
import { useOrdersSync } from '@/features/orders/useOrdersSync';
import { useTrackingSync } from '@/features/tracking/useTrackingSync';
import { useActionQueueSync } from '@/features/trip/useActionQueueSync';
import { useAppFlagsStore } from '@/store';

/** Tabs that show their own inline demo strip. Home's file is `orders.tsx`, so its path is `/orders`; Profile shows it in its hero. */
const INLINE_BANNER_PATHS = ['/orders', '/route', '/profile'];

export default function TabsLayout() {
  const permissionsPrompted = useAppFlagsStore((state) => state.permissionsPrompted);
  const hasInlineBanner = INLINE_BANNER_PATHS.includes(usePathname());

  // Keep today's orders fresh (and the Orders tab badge right) on every tab.
  useOrdersSync();
  // Send pickup and delivery updates that are waiting for a connection.
  useActionQueueSync();
  // Share the rider's location in the background for as long as the shift is online.
  useTrackingSync();

  // First sign-in: walk the rider through the permission wizard once.
  if (!permissionsPrompted) return <Redirect href="/permissions" />;

  return (
    <>
      <AppTabs />
      {/* Home, Route and Profile show their own inline demo strip. */}
      {hasInlineBanner ? null : <DemoBanner />}
    </>
  );
}
