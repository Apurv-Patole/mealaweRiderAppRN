# Mealawe Rider (React Native)

The delivery-rider app for Mealawe. It replaces the old Ionic app in `../riderAppAI`, built with React Native and Expo for Android and iOS. Bundle id: `com.mealawerider.app`.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19 · Expo Router (native tabs) · NativeWind v5 + Tailwind v4 · Zustand · MMKV + SecureStore · zod.
**Backend:** `../MealaweServerApp` (shared). The rider API contract is in [docs/RIDER_APP_SERVER_ARCHITECTURE.md](docs/RIDER_APP_SERVER_ARCHITECTURE.md).

## What the app does

| Area | What the rider can do |
|---|---|
| Sign in | Phone + OTP, or apply to join (4-step form with document photos) |
| Home | See today's shifts, order counts, distance, and progress |
| Route | Mark attendance (selfie + GPS within 100 m of the kitchen), start/end a shift, follow the next pickup or delivery stop on a map |
| Orders | Pick up at a kitchen, start the delivery ride, deliver with a photo, ask admin to cancel |
| Tracking | Location is shared in the background during a shift, even with no signal (pings are saved and sent later) |
| Wallet | Balance, salary, incentives, history (opened from Profile) |
| Profile | Edit details and documents, permissions, theme (system / light / dark) |

Screens live in `src/app/`; the logic behind them is in `src/features/<area>/` (see [src/features/README.md](src/features/README.md)).

## Quick start

```bash
npm install            # run ONE install at a time on Windows
npm start              # dev server (needs a development build, not Expo Go)
npm run android        # build and run on a connected Android phone
npm run check          # types + lint (zero warnings) + unit tests: run before pushing
```

Expo Go does not work: `react-native-mmkv` and Firebase need native code, so use a development build (`npm run build:dev:android`, or `npm run android` locally).

Choose the backend with `start:local`, `start:staging` or `start:prod` (sets `EXPO_PUBLIC_ENV`).

| Goal | Command |
|---|---|
| Unit tests | `npm test` |
| Types / lint / auto-fix | `npm run typecheck` / `npm run lint` / `npm run lint:fix` |
| Config health | `npm run doctor` |
| End-to-end flows (Maestro) | `npm run e2e` (see [.maestro/README.md](.maestro/README.md)) |
| Regenerate native projects | `npm run prebuild` (generated, git-ignored) |

## Builds and releases (EAS)

Project: `@yagy-team/MealaweRiderAppRN`. EAS CLI is pinned inside the scripts (`npx eas-cli@25.3.0`); do not downgrade it.

| Profile | Output | Channel / backend | Use |
|---|---|---|---|
| `development` | Android APK, iOS device build | staging | Dev client |
| `staging-preview` | Android APK | staging | Internal testing |
| `staging-testflight` | iOS (store distribution) | staging | TestFlight testers |
| `production-preview` | Android APK | production | Smoke test, rider pilot |
| `production` | Android AAB, iOS (store) | production | Store release |

TestFlight only accepts store-distribution builds, which is why iOS staging has its own profile.

### One-command workflows

Manual only (no automatic trigger). Each builds Android and iOS, and sends iOS to TestFlight.

| Command | Builds |
|---|---|
| `npm run workflow:staging` | Android staging APK + iOS staging → TestFlight (`internal` group) |
| `npm run workflow:production-preview` | Android production APK + iOS production → TestFlight |
| `npm run workflow:deploy` | Android production AAB + iOS production → TestFlight |

### Release policy

- Android is never submitted to production automatically. Submit to `internal`, test, then `alpha`, `beta`, and promote the **same** tested binary to production in Play Console: `npm run submit:android:internal` (`alpha`, `beta`, `production`).
- iOS goes to TestFlight only. Nothing reaches the App Store until you press "Submit for Review" in App Store Connect.
- Versions: `appVersionSource: remote` with `autoIncrement`. Change `version` in `app.json` for a new release.
- OTA updates: `npm run update:staging` / `npm run update:production`. Updates only reach builds with the same app version.

## One-time setup before store releases

### Android
1. `play-store-credentials.json` (Play Console service-account key) at the repo root. It is git-ignored.
2. The upload keystore. Reuse the live Ionic rider app's key so riders update in place (upload with `npx eas-cli@25.3.0 credentials`), or request an upload-key reset in Play Console.

### iOS
1. Create the app in App Store Connect with bundle id `com.mealawerider.app` (team `9UG32G8N3S`).
2. Put the app's numeric **Apple ID** (App Store Connect → the app → App Information) into `ascAppId` under `submit.internal.ios` and `submit.production.ios` in `eas.json`. Workflows cannot prompt, so submit fails without it.
3. Run `npx eas-cli@25.3.0 credentials -p ios` once. Sign in to Apple so EAS creates the certificate and profile, and upload the App Store Connect API key there (no `.p8` file is read from disk).
4. Add `GoogleService-Info.plist` (Firebase project `mealawerider`, bundle id above): commit it at the repo root, or upload it as an EAS file variable named `GOOGLE_SERVICES_INFO_PLIST`.
5. Upload an APNs key in Firebase Console → Cloud Messaging, or push will not reach iPhones.

### Both
- `GOOGLE_MAPS_API_KEY` as an EAS environment variable (`eas env:create`) or a local `.env`. It is not committed. Enable Maps SDK for Android and iOS on the key. Without it the app works but the map shows a notice.
- `google-services.json` (Android Firebase) is committed.

## Project layout

```
src/app/          Routes (Expo Router): tabs, order, deliver, wallet, login...
src/features/     Logic per area: auth, shift, orders, route, trip, tracking, wallet, push...
src/components/   Shared UI (ui/ primitives, dialog/, app-tabs)
src/services/     HTTP client (plain JSON + Bearer token, no AES)
src/theme/        Rider palette; colours come from tokens in src/global.css
src/store/        Zustand stores
.eas/workflows/   EAS workflows      .maestro/   E2E flows
docs/             Plan, server contract, QA checklist, development notes
```

## Rules of the codebase

- **Colours:** never a raw hex in a screen; use tokens (`bg-primary`, `text-muted-foreground`) or `StatusChip`. The rider palette is separate from the customer app's.
- **Text:** use `AppText` with a `variant`. Touch targets are at least 48 dp (56 for the main action).
- **Offline first:** pickup, delivery and location pings are saved on the phone first, then sent in retryable steps. Status changes use `PATCH /api/rider/order/:id/status`, never the generic order update.
- **Polling, not sockets:** orders refresh every 60 s while the app is open; push nudges an earlier refresh. Location pings are 30 s while delivering, 60 s otherwise (the server can change this).
- **Pure logic is unit-tested** (`__tests__/*.test.mts`, Node's test runner, no React Native imports). Add a test with every logic change.
- Strict TypeScript, ESLint with zero warnings, immutable updates, no `console.log`, exact dependency versions. Add packages with `npx expo install <pkg>`.
- `app.config.js` allows plain HTTP (needed by local and staging) only outside production builds.
- `.easignore` replaces `.gitignore` for cloud builds; keep the two in sync by hand.

## Gotchas

- `lightningcss` is pinned to 1.30.1 in `overrides`; newer versions break `react-native-css`. Keep it until NativeWind v5 is stable.
- After adding a route file, run `CI=1 npx expo start` once so typed routes regenerate, or `tsc` will not know the new path.
- Android phones from Realme, OPPO and Xiaomi kill background apps; the battery step in the permission wizard exists for them. Test tracking on one.
- Photo uploads must use `appendPart` (`src/lib/formParts.ts`); the old `{ uri, name, type }` form part throws on Expo SDK 54+.

## More documentation

- [docs/DEVELOPMENT-NOTES.md](docs/DEVELOPMENT-NOTES.md): why things work this way and how they differ from the Ionic app
- [docs/RIDER_APP_RN_PLAN.md](docs/RIDER_APP_RN_PLAN.md): plan and stage breakdown
- [docs/RIDER_APP_SERVER_ARCHITECTURE.md](docs/RIDER_APP_SERVER_ARCHITECTURE.md): server contract
- [docs/QA-HARDENING.md](docs/QA-HARDENING.md): device matrix, battery and sync tests
- [CHANGELOG.md](CHANGELOG.md)
