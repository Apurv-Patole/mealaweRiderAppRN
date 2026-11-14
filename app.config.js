// Dynamic override layer on top of app.json (Expo's standard pattern: Expo CLI
// parses app.json's "expo" object and passes it in as `config`).
//
// Why this file exists: plain-HTTP traffic is only needed by the `local` (LAN IP)
// and `staging` (plain-HTTP load balancer) backends, see src/config/environments.ts.
// Production talks to https://api.mealawe.com over TLS, so production builds drop
// the iOS App Transport Security exception and the Android cleartext permission.
//
// `EXPO_PUBLIC_ENV` is set by eas.json's build profiles and by the `*:prod`
// scripts; unset means production, same default as src/config/env.ts.
const fs = require('fs');

// iOS Firebase config. EAS: upload GoogleService-Info.plist as a file-type environment variable
// named GOOGLE_SERVICES_INFO_PLIST (its value is a path on the build worker). Locally: drop the file
// at the repo root. Without either, iOS prebuild fails loudly at the Firebase plugin (intended).
const resolveIosGoogleServicesFile = () => {
  if (process.env.GOOGLE_SERVICES_INFO_PLIST) return process.env.GOOGLE_SERVICES_INFO_PLIST;
  return fs.existsSync('./GoogleService-Info.plist') ? './GoogleService-Info.plist' : undefined;
};

module.exports = ({ config }) => {
  const iosGoogleServicesFile = resolveIosGoogleServicesFile();
  const isProduction = !process.env.EXPO_PUBLIC_ENV || process.env.EXPO_PUBLIC_ENV === 'production';
  // Google Maps key for the native map. Provide it as the GOOGLE_MAPS_API_KEY build variable
  // (EAS environment variable, or a local .env for development); it is deliberately not committed.
  // Without it the app still works and the Route tab shows a notice instead of the map.
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    ios: {
      ...config.ios,
      ...(iosGoogleServicesFile ? { googleServicesFile: iosGoogleServicesFile } : {}),
      config: { ...config.ios.config, ...(googleMapsApiKey ? { googleMapsApiKey } : {}) },
      infoPlist: {
        ...config.ios.infoPlist,
        NSAppTransportSecurity: isProduction ? undefined : { NSAllowsArbitraryLoads: true },
      },
    },
    android: {
      ...config.android,
      config: { ...config.android.config, ...(googleMapsApiKey ? { googleMaps: { apiKey: googleMapsApiKey } } : {}) },
    },
    plugins: config.plugins.map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
        return [
          'expo-build-properties',
          {
            ...plugin[1],
            android: {
              ...plugin[1].android,
              usesCleartextTraffic: !isProduction,
            },
          },
        ];
      }
      return plugin;
    }),
  };
};
