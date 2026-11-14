import { nativeApplicationVersion } from 'expo-application';
import { useEffect, useState } from 'react';

import { FORCE_UPDATE_TIMEOUT_MS } from '@/config/constants';
import { env } from '@/config';

import { appUpdateApi } from './appUpdateApi';
import { isVersionBelow } from './versionCompare';

export type ForceUpdateStatus = 'checking' | 'ok' | 'blocked';

/**
 * Boot-time check against the minimum-version document. Fails open on any error, timeout or
 * malformed response: a gate that locks every rider out on a backend hiccup is worse than the bug
 * it prevents. Runs once per cold launch.
 */
export function useForceUpdateCheck(): ForceUpdateStatus {
  const [status, setStatus] = useState<ForceUpdateStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setStatus('ok');
    }, FORCE_UPDATE_TIMEOUT_MS);

    appUpdateApi
      .getAppVersionByName(env.appName)
      .then((res) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        const required = res?.appVersion;
        const blocked =
          res?.appName === env.appName &&
          typeof required === 'string' &&
          !!required &&
          typeof nativeApplicationVersion === 'string' &&
          isVersionBelow(nativeApplicationVersion, required);
        setStatus(blocked ? 'blocked' : 'ok');
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setStatus('ok');
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return status;
}
