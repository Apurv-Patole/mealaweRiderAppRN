import { environments, type AppEnvironment, type EnvName } from './environments';

/**
 * Active environment, selected by `EXPO_PUBLIC_ENV` (local | staging |
 * production). Defaults to production. `EXPO_PUBLIC_API_URL` overrides the
 * server URL (handy for pointing a device at a LAN IP).
 */
const DEFAULT_ENV: EnvName = 'production';

export function resolveEnvName(raw: string | undefined): EnvName {
  return raw === 'local' || raw === 'staging' || raw === 'production' ? raw : DEFAULT_ENV;
}

export function buildEnv(rawEnv: string | undefined, apiUrlOverride: string | undefined): AppEnvironment {
  const active = environments[resolveEnvName(rawEnv)];
  const serverUrl = apiUrlOverride && apiUrlOverride.trim() ? apiUrlOverride.trim() : active.serverUrl;
  return { ...active, serverUrl: serverUrl.replace(/\/+$/, '') };
}

export const env: AppEnvironment = buildEnv(
  process.env.EXPO_PUBLIC_ENV,
  process.env.EXPO_PUBLIC_API_URL,
);

export type { AppEnvironment, EnvName };
