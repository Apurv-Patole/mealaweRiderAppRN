import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { retryDelayMs } from '@/lib/backoff';

/**
 * Runs `task` now and then every `intervalMs` while `enabled` and the app is in the foreground.
 *  - Changing `restartKey` (for example a filter) runs the task again immediately.
 *  - The next run is scheduled only after the previous one finishes, so slow networks never stack requests.
 *  - A task that reports failure (resolves false or throws) backs off with jitter instead of hammering the server.
 *  - Coming back to the foreground runs the task immediately.
 */
export function usePolling(task: () => Promise<boolean>, intervalMs: number, enabled: boolean, restartKey = ''): void {
  // Keep the latest task without restarting the loop every render.
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task;
  });

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let running = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (delayMs: number) => {
      if (stopped) return;
      clearTimeout(timer);
      timer = setTimeout(() => void run(), delayMs);
    };

    const run = async () => {
      if (stopped || running) return;
      if (AppState.currentState !== 'active') {
        schedule(intervalMs);
        return;
      }
      running = true;
      let ok = false;
      try {
        ok = await taskRef.current();
      } catch {
        ok = false;
      }
      running = false;
      attempt = ok ? 0 : attempt + 1;
      schedule(ok ? intervalMs : retryDelayMs(attempt - 1));
    };

    void run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [enabled, intervalMs, restartKey]);
}
