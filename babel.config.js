// Babel config for Expo SDK 57 + NativeWind v5 (Tailwind v4) + Reanimated 4.
// `nativewind/babel` registers `react-native-worklets/plugin`, so babel-preset-expo's
// own worklets pass is disabled to register it exactly once. `@/*` -> `src/*` comes
// from tsconfig via Expo Metro (no module-resolver plugin).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { worklets: false }], 'nativewind/babel'],
  };
};
