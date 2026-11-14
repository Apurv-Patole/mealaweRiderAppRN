import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { openAppSettings, readStatuses, requestPermission } from './permissionService';
import {
  actionFor,
  INITIAL_STATUSES,
  isReady,
  type PermissionKey,
  type PermissionStatuses,
} from './permissionState';

export interface UsePermissions {
  statuses: PermissionStatuses;
  ready: boolean;
  /** True until the first read finishes, so screens do not flash "Not set". */
  loading: boolean;
  /** Runs the right action for a permission (prompt, or open Settings) and refreshes. */
  act: (key: PermissionKey) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Live permission statuses. Re-reads when the app returns to the foreground,
 * because the rider changes permissions in system Settings and comes back.
 */
export function usePermissions(): UsePermissions {
  const [statuses, setStatuses] = useState<PermissionStatuses>(INITIAL_STATUSES);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setStatuses(await readStatuses());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const act = useCallback(
    async (key: PermissionKey) => {
      const action = actionFor(key, statuses[key]);
      if (action === 'openSettings') await openAppSettings();
      else if (action !== 'none') await requestPermission(key);
      await refresh();
    },
    [refresh, statuses],
  );

  return { statuses, ready: isReady(statuses), loading, act, refresh };
}
