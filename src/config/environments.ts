/**
 * Per-environment configuration. Select the active profile with the
 * `EXPO_PUBLIC_ENV` variable (`local` | `staging` | `production`); see `env.ts`.
 *
 * Server URLs are carried over from the Ionic rider app
 * (`riderAppAI/src/environments`). No secrets live here: the rider API is
 * plain JSON with a Bearer token.
 */
export type EnvName = 'local' | 'staging' | 'production';

export interface AppEnvironment {
  envName: EnvName;
  serverUrl: string;
  /** Distance from the kitchen within which pickup and attendance are allowed. */
  kitchenProximityMeters: number;
  appName: string;
}

export const environments: Record<EnvName, AppEnvironment> = {
  local: {
    envName: 'local',
    // Android emulator reaches the host machine at 10.0.2.2; override with
    // EXPO_PUBLIC_API_URL for a physical device on the LAN.
    serverUrl: 'http://192.168.1.35:5000',
    kitchenProximityMeters: 500,
    appName: 'mealawe-rider',
  },
  staging: {
    envName: 'staging',
    serverUrl: 'http://mealawelbstaging-486868523.ap-southeast-1.elb.amazonaws.com:5000',
    kitchenProximityMeters: 500,
    appName: 'mealawe-rider',
  },
  production: {
    envName: 'production',
    serverUrl: 'https://api.mealawe.com',
    kitchenProximityMeters: 500,
    appName: 'mealawe-rider',
  },
};
