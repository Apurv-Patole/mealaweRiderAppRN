import { useNow } from '@/hooks/useNow';

import { describeTracking } from './trackingCore';
import { loadBuffer, loadState } from './trackingStorage';

/** How often the "last sent" line is refreshed. */
const REFRESH_MS = 10_000;

/** One line about location sharing for the Route tab: on or off, when the last ping went, and what is waiting. */
export function useTrackingText(): string {
  const now = useNow(REFRESH_MS);
  const state = loadState();
  return describeTracking(
    { active: state !== null, lastPingAt: state?.lastPingAt ?? null, waiting: loadBuffer().length },
    now,
  );
}
