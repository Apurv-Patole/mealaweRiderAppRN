@AGENTS.md

# MealaweRiderAppRN — Claude working notes

React Native + Expo rewrite of the Ionic rider app (`../riderAppAI`). The server is
`../MealaweServerApp` (rider branch `feature/rider-app-server`). Plan and stages:
**[docs/RIDER_APP_RN_PLAN.md](docs/RIDER_APP_RN_PLAN.md)**.

**Stack:** Expo SDK 57 · RN 0.86 · React 19.2 · Expo Router (+ NativeTabs) · NativeWind v5 +
Tailwind v4 · Zustand · expo-secure-store + react-native-mmkv · expo-location (background) +
expo-task-manager · react-native-maps · @react-native-firebase/messaging + notifee · zod.
Android + iOS only. Every dependency is pinned exactly (except Expo's own `~` ranges).

> **Tests:** every change to logic gets a pure unit test in a `__tests__/*.test.mts` file next to
> it (`npm test`, Node's test runner, no React Native imports in the code under test). Also run
> `npm run typecheck`, `npm run lint` and `npx expo export --platform android`. Native changes need a
> dev-client rebuild (`npx expo prebuild` then `npm run android:local`). E2E is Maestro only: see
> **[.maestro/README.md](.maestro/README.md)**. Device matrix, battery/data checks and the
> customer-and-rider sync scenarios: **[docs/QA-HARDENING.md](docs/QA-HARDENING.md)**.

## Rules that matter here

- **The rider app has its own palette** (`src/theme/palette.ts`). Never use the customer app's.
  Colours come from tokens in `src/global.css` and `src/theme/`; no raw hex in screens.
  Order status colours come from `useStatusColors(tone)`, and status is never colour alone.
- **Text:** use `AppText` with a `variant`. Never set font size or colour by hand.
- **Touch targets** are at least 48 px (`TOUCH` in `src/theme/layout.ts`). Riders use this
  outdoors, one-handed, in sunlight.
- **Orders sync by polling** (no sockets, no Redis): 60 s while the app is open, nudged by push.
  Location ping is 30 s while delivering, 60 s otherwise; the server's `nextPingMs` wins.
- **Pickup and delivery actions go through the offline action queue** (`src/features/trip/`)
  so they survive no signal. Use `PATCH /api/rider/order/:id/status`, never the generic
  `updateFoodOrder` (it replaces the whole `statusHistory`).
- The rider API is plain JSON with a Bearer token (no AES). Endpoints live in
  `src/services/http/endpoints.ts`.
- Immutable updates, explicit error handling, files about 200 to 400 lines.

## Layout

See **[src/features/README.md](src/features/README.md)** for the domain map. Routing lives in
`src/app/`; feature folders hold the logic and UI those routes render.
