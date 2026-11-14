# Development notes (history and decisions)

Per-stage build notes moved out of the README. Read these when you need to know why something works the way it does, or how it differs from the old Ionic rider app. Current setup and commands are in [../README.md](../README.md).

## Stage 2 notes: where this differs from the Ionic app

- **GPS is required to start a shift.** The old app sent (0, 0) when GPS failed; this one shows an error instead.
- **End shift reports failures.** The old app cleared the shift locally even if the server call failed, leaving the server
  "online". Here the shift only ends locally after the server confirms.
- **A kitchen with no usable coordinates does not block attendance.** The old planner replaced it with a made-up point in
  central India, which blocked the rider at an absurd distance.
- **The selfie is not stamped** with rider, route, slot and GPS text like the Ionic photo. Location and time are still sent
  as fields. Stamping needs a canvas library; decide before the pilot whether ops needs the burned-in overlay.
- Ending a shift does not stop location pings yet, because pinging arrives in Stage 5.

## Stage 3 notes

- **Google Maps key:** the map reads `GOOGLE_MAPS_API_KEY` at build time (`app.config.js`). Set it as an EAS environment
  variable (`eas env:create`) or a local `.env` for development. It is not committed. Without it the map is replaced by a
  notice and everything else works. The Ionic rider app's keys are in `riderAppAI/src/config/google.config.ts`; the Android
  map needs one that allows package `com.mealawerider.app` and the Maps SDK for Android.
- **One request per refresh:** `searchRiderFoodOrderList` for the day (no meal filter) feeds the stats, both tabs and the
  badge; slots are separated on the device. The server's `/orders/dashboard` call is not used.
- **Planner differences from Ionic:** an order with no usable coordinates is listed under "Needs attention" instead of being
  placed at a made-up point in central India. Customers of orders still at a kitchen become stops once that kitchen is
  visited, as before.
- **Polling:** 60 s, foreground only. The server `changes` endpoint and cancel push from the plan (S2) do not exist yet; when
  they do, this hook polls that instead and a customer cancellation reaches the rider within seconds.
- Pickup and delivery buttons are Stage 4. Stop cards are read-only plus Navigate.
- Typed routes: after adding a route file, run `CI=1 npx expo start` once so `.expo/types/router.d.ts` regenerates, or
  `tsc` will not know the new path.

## Stage 4 notes

- **Why a queue:** a rider is often offline (kitchen basement, lift). Each action is stored on the phone and sent as steps,
  so a retry never uploads a photo twice or changes a status twice. The queue retries every 15 s while anything waits, and at
  once on foreground. Updates the server refuses (cancelled or already delivered order) stay visible as "Not sent" with the
  reason until dismissed. Photos are referenced by their local path, so a photo the phone deletes before sending cannot be sent.
- **Safer than Ionic:** all three status changes use `PATCH /api/rider/order/:id/status`, which appends to the order's history.
  The Ionic app used the generic update, which replaces the whole status history when given a partial body (pickup) and
  overwrites the full order with a stale copy (delivery).
- **Server change that goes with this** (`MealaweServerApp`, branch `feature/rider-app-server` on origin, one commit on top of `upstream/master`): `src/util/riderTransition.util.js` (+ tests),
  `transitionStatus` in `riderShift.service.js`, the PATCH route, and `hasError409` in `response-handler.js`. It makes a repeat
  of the current status a no-op, refuses (409) a cancelled or already delivered order, and records `handOverTo`. The app works
  against the old server too, except `handOverTo` is not saved and a cancelled order is not refused.
- **Start Delivery Ride needs a connection** (every picked-up order must become "on the way" for the customer); it is not queued.
- **Not yet:** background location pings (Stage 5), earnings (Stage 6), the "Deliver" proximity rule (the Ionic app has none).

## Stage 5 notes

- **Pings are sent from a background task** (`expo-task-manager`) that Android keeps alive with a foreground-service
  notification ("Sharing your location for active deliveries"). The task file is imported from the root layout so the OS can
  start it headless; its state and the unsent pings are in local storage, not memory.
- **Distance for pay:** the phone adds up road distance between fixes (`segmentMeters`), ignoring fixes worse than 50 m, movement
  under 5 m (jitter) and jumps over 55 m/s. The server validates it again.
- **Rate:** 30 s in the delivery stage (after Start Delivery Ride), 60 s otherwise. The server's reply carries `nextPingMs`
  (kept within 10 s to 2 min), so it can be tuned without an app release.
- **Stops by itself** when: the rider ends the shift, the server auto-ends it (its reply says `stop`), the session is revoked
  (401), or the rider signs out. A leftover ping for an OLDER shift is dropped without stopping the current one.
- **Server changes that go with this** (`MealaweServerApp`, branch `feature/rider-app-server` on origin, one commit on top of `upstream/master`): `src/util/pingPolicy.util.js` (+ tests), `processLocationPing`
  (ignores pings for a shift that is not online, stores `heading`, returns `nextPingMs`, and now updates the runner location of every
  on-the-way order itself, so the app makes ONE call instead of one per order), `findShiftStatus` and `findOnTheWayOrderIds` in
  `riderShift.dao.js`, and `heading` on the ping model. Older apps keep working (they ignore the new reply fields).
- **Needs a real build to verify:** the foreground service declaration comes from the `expo-location` library and only merges in at
  Gradle build time. Check on a phone, especially Realme, OPPO and Xiaomi, which kill background apps. The battery-settings
  step in the permission wizard exists for them.
- **Not yet:** a UI for "tracking stopped unexpectedly", earnings (Stage 6).

## Stage 6 notes

- **The "Order value" figure on the Orders tab is the total of delivered orders, not the rider's pay.** The Ionic app called it
  "income". Rider pay is the salary and incentives in Wallet. Do not relabel it "earnings".
- **No live earnings strip yet.** The server only works out an incentive when a shift ENDS (`calculateShiftIncentive`), so there is
  nothing to show for a shift in progress. A progress strip needs a new server endpoint that evaluates the slabs against the shift so far.
- **Incentives are held for 7 days** (`holding`), then a daily server job moves them to the wallet (`credited`). The wallet balance
  excludes held amounts; the Wallet tab shows the held total underneath.
- **Ledger kinds:** a manual debit with a `salary-` source id is a salary payout; any other manual debit is a deduction (a fine or a
  damage charge). The Ionic app separated them the same way.
- **Not built:** profile editing (needs multipart `/api/rider/profile/update` with document photos, like registration) and the biometric
  lock (`expo-local-authentication`). Both are small and independent of the rest.

## Conventions

- **Colors:** never put a raw hex in a screen. Use NativeWind tokens (`bg-primary`, `text-muted-foreground`,
  `bg-card`) or `StatusChip` / `useStatusColors`. Status colors have `fill` (dots, bars), `ink` (text on light)
  and `soft` (badge background). `src/theme/__tests__/palette.test.mts` guards contrast (4.5:1).
- **Tab bar:** all in `src/components/app-tabs.tsx`. `NativeTabs` is `unstable_` in Expo Router; if an Expo
  upgrade breaks it, this is the only file to fix (fallback: JS `Tabs` with the same colors).
- **Pure logic** (validation, normalizers, state transitions, helpers) lives in modules with no React Native
  imports so it is unit-tested with `node --test`. Use the `@/` alias; the test resolver maps it.
- **Touch targets:** 48 dp minimum, 56 dp for the main action.
- **Immutable updates** and no `console.log` in app code (lint-enforced).
- **Strict by default:** TypeScript has `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals` and
  more; ESLint runs with `--max-warnings 0` and bans `any`, `==`, `var`, param reassignment and inline
  `import()` types. All dependencies are pinned to exact versions (`.npmrc`: `save-exact`, `engine-strict`);
  Expo-managed packages keep Expo's `~` ranges. Add a dependency with `npx expo install <pkg>`.

## Gotchas
## Open items before the first device build

- **App id:** `com.mealawerider.app`, the live Ionic rider app's id, so riders update in place.
- **Firebase (Android): done.** `google-services.json` is copied from `riderAppAI` (same project `mealawerider`,
  same package) and committed. iOS has no `GoogleService-Info.plist` yet, so an iOS prebuild will fail until one
  is added with `ios.googleServicesFile`; this is part of the iOS launch.
- **Signing key and Play credentials are NOT in `riderAppAI`** (git-ignored, never checked in). Needed: the live
  app's upload keystore (`.jks` plus its passwords), uploaded with `npx eas-cli@25.3.0 credentials`, and
  `play-store-credentials.json` (a Play Console service-account key). Without the original upload key, a new
  one can be registered through Play Console (App signing, request upload key reset).
- **Not done in Stage 1:** the Android camera-killed-the-app recovery (`ImagePicker.getPendingResultAsync`) is added
  with the attendance selfie in Stage 2, where it matters most.
- **Not verified on a device yet:** native tabs (badges, indicator color, safe areas), OTP login and push token
  registration against a real server, the permission prompts, document picking, and light/dark rendering. Verified so far: type check, unit tests, and Android + iOS bundle export.

## Stage 7 notes (in progress)

- **7a done: push events now do something.** `src/features/push/pushReactions.ts` (pure, tested) decides the response; `usePushReactions` (mounted in the root layout) refreshes orders at once, shows an in-app banner (`PushBannerView`) when the app is open, and opens the Orders (or Route, for attendance reminders) tab when a notification is tapped. Events now carry a `source` (`foreground` or `opened`).
- **7b done: notifications while the app is closed.** The server already sends a visible notification payload with channel `mealawepushnotification`; `src/features/push/channels.ts` now creates that channel (HIGH importance, default sound) through `@notifee/react-native` 9.1.8, same as the customer app, so Android no longer drops rider pushes into a quiet fallback channel. Needs a dev build (native module). Notification permission is already asked in the permissions wizard.
- **Not done:** the custom `push_notification.wav` sound (a copy is in `mealaweKitchenPartner/resources/`; it needs an `expo-notifications` plugin `sounds` entry or an Android `res/raw` file).
- **7c done: dark-mode and accessibility pass.** Audit found colours already come from the theme (no stray hex in screens) and every `Pressable` has a role and label. Fixed the gaps: the route map now uses a dark style (Google night style on Android, `userInterfaceStyle` on iOS), pull-to-refresh is themed, `AppText` marks display/h1/h2 as screen-reader headings and caps font scaling at 1.4x, form errors are announced. Not device-tested; run TalkBack/VoiceOver and a dark-mode walkthrough before the pilot.
- **Still to do in Stage 7:** Hindi and Marathi copy (needs ops-reviewed translations).
- Not device-tested.

## Stage 8 notes (in progress)

- **8a done: Maestro flows** in `.maestro/` (login, attendance and shift, pickup and delivery, offline queue, wallet and history, dark mode), run with `npm run e2e`. YAML checked, **not run**: no device or emulator was attached here. Flows 02 and 03 need a staged route/order, a mocked GPS fix at the kitchen, and the emulator camera set to a virtual scene; the camera taps are best-effort.
- Added `testID`s `phone-input` and `otp-input`. Other screens are matched by their visible text.
- **8b: `docs/QA-HARDENING.md`** holds the device matrix, battery and data measurement, and the customer-and-rider sync scenarios (manual, two phones).
- **Not done:** Crashlytics, performance measurements, store listing assets.

## Design pass (after Stage 8a)

- **Front-camera selfie:** the attendance selfie now uses an in-app camera screen (`src/app/selfie.tsx`, `expo-camera`, `facing="front"`) with a face outline, shutter, and retake or use. The system camera could not be forced to the front lens on every Android phone. This replaces the old "camera killed the app" recovery, which the in-app camera does not need. **Needs a native rebuild** (`npm run android:local`) because `expo-camera` is a new native module.
- **Look:** Plus Jakarta Sans font (same as the Figma designs), rounded and softly lifted cards, `IconTile`, `ListRow`, `SectionTitle`, `SegmentedControl`, `Avatar`. Dark mode is a green-tinted near-black that mirrors the light palette.
- **Orders tab:** greeting header, date tiles (Today, Tomorrow, then the next days), meal-slot segmented control with one progress card, redesigned order cards (status stripe, pick up and deliver-to stops, footer with items, time, amount).
- **Profile:** avatar header with route and areas, grouped rows (attendance and order history, permissions), theme segmented control, sign-out row.
- **Wallet:** balance hero card in the brand colour.
- Not device-verified after the font and card changes (the phone was disconnected); check Orders, Route, Wallet and Profile after the rebuild.

## Sign-in and apply-to-join redesign

- Shared `AuthLayout` (brand-green hero with logo, title and perks, rounded form sheet) for login and register. Login now has a phone field with icon and +91 prefix, a privacy-policy link (`<server>/public/riderPrivacyPolicy`, the same page the Ionic app opens), and a "Register here" link. Register has a step progress bar, a hero showing the step, a privacy note on the last step, and a success state.
- There is no rider "terms" page on the server, so only the privacy policy is linked.
- Checked on a device (Samsung, dark mode): login and register step 1 render correctly.

## Home, profile and tabs (design round 2)

- **Three tabs, like the old rider app:** Home, Route, Profile. Wallet is no longer a tab; it opens from Profile ("Wallet and earnings", `src/app/wallet.tsx`).
- **Home** (`src/app/(tabs)/orders.tsx`, route `/orders`): green hero (rider, route, on/off shift, **zone**), delivery-date tiles (Today, Tomorrow, then next days), zone filter chips, four stat tiles (orders, active, delivered with %, kitchens), and the three daily shift cards (status, time, total/pickup/delivered/pending, progress). Tapping a shift opens `src/app/shift-orders/[meal].tsx` with that shift's orders.
- **Profile:** hero with photo initials, phone, status, route and zones; Edit profile; wallet, attendance history, order history; permissions; theme; sign out.
- **Edit profile** (`src/app/edit-profile.tsx`): photo, name, email, emergency contact, blood group, bank and UPI, home address; phone number is read-only. Saves to `POST /api/rider/profile/update` (multipart, same field names as the Ionic app). KYC document re-upload is not included.
- Checked on a Samsung phone (dark mode): Home, Profile and Edit profile render with real data. The selfie camera and saving a profile are not yet tested.

## Round 3 changes

- **Zones are not shown to the rider** (matches the old rider app): removed from Home and Profile. Order filtering by the rider's zones still happens in the background (all of the rider's zones).
- **Home:** distance tile (km from the shift the server is counting) and a live bar while on shift (km travelled, time on shift). Distance refreshes with the 60 s orders poll while a shift is running. Today's earnings is still not shown: it needs a new server endpoint.
- **Permissions:** the wizard now also asks for **Camera** with the native system prompt (needed for the selfie and proof photos). Background location on Android 11+ still has to be set in the system Settings screen ("Allow all the time"); that is an Android rule.
- **Edit profile:** profile photo plus the registration ID documents (Aadhaar front and back, PAN, driving licence, bank proof, UPI QR) with current pictures shown and replaceable.
- **Selfie camera:** removed the mirror prop, set picture mode and added a mount-error message. Not verified on a device (the session was signed out when I tried).

## In-app dialogs and the selfie fix

- **Dialogs:** `src/components/dialog/` replaces the plain system alerts with rounded in-app dialogs: `dialog.confirm` (sign out, end shift, start ride), `dialog.success` / `dialog.error` (profile saved, photo not added) and `dialog.choose` (bottom sheet for camera or gallery). `DialogHost` is mounted in the root layout; dialogs queue, so two never stack.
- **Selfie black screen, cause and fix:** the camera preview is drawn on a surface behind the window, and the selfie screen's container had an opaque black background that hid it. The container is now transparent. Checked on a Samsung phone: the front camera preview shows.
- Camera permission is now part of the permissions wizard (native prompt).

## Photo uploads and the selfie shutter

- **Attendance error cause:** Expo SDK 54+ uses the standard `fetch`, whose `FormData` accepts only strings and real `Blob`/`File` objects. The old React Native `{ uri, name, type }` file part threw "Unsupported FormDataPart implementation", which the app showed as "Could not reach the server". Fixed with `appendPart` in `src/lib/formParts.ts` (wraps the file in expo-file-system's `File`). It is used by attendance, the apply-to-join form, edit profile (photo and documents) and pickup/delivery proof photos. Verified on a phone for attendance only.
- In development builds a failed request now logs its real reason (`[http] POST ... failed`) in the Metro console.
- **Shutter:** the selfie camera takes the picture with `shutterSound: false` and no shutter flash animation. Some phones play a system shutter sound that apps cannot switch off (some regions require it by law).

## Map routes (free)

- **Road line: OSRM, free, no key.** `src/features/route/directionsApi.ts` asks `router.project-osrm.org` for the driving route to the NEXT stop only (when the stop changes, or after the rider moved 200 m and 90 s passed).
 The public server is for light use; for a big fleet host your own OSRM (free software) and set `EXPO_PUBLIC_ROUTING_URL`. The call goes straight to OSRM and does not carry the rider's login token.
- **Traffic: Google's map traffic layer, free.** The map shows live traffic colours on the roads (toggle button "Traffic"); that layer is part of the free mobile Maps SDK. The ETA shown ("About 12 min") is normal driving time, **not** traffic-adjusted: no free service gives traffic-aware ETAs. The "Open in Google Maps" button gives turn-by-turn navigation with live traffic, also free.
- Needs `GOOGLE_MAPS_API_KEY` in the build for the map itself. Not tested on a device: the test rider has no assigned order, so there is no next stop.

## Order details, simpler Route tab, tab badge

- **Order detail** (`src/app/order/[id].tsx`) now follows the old rider app: a five-step progress bar with times (Assigned, Ready, Picked up, On the way, Delivered), a green "Next step" card with Navigate, a pickup-to-drop timeline with Call and Navigate on each stop, date/meal/type chips and the special request, a folded "Order items" list with prices and add-ons, delivery and pickup proof photos with "handed to" once delivered, and a fixed bottom bar (Deliver, Cannot deliver? Ask admin). The order model now carries status history, proof URLs, hand-over name and item prices. Proof photo URLs that are not full links are read from `<server>/images/`.
- **Route tab:** one "Next up" card holds the single main action (Start pickup, Start delivery ride or Deliver), the road distance and time, the order numbers (tap to open the order) and Navigate. Below it a shorter map and a compact "Then" list of the remaining stops (tap a stop to open its order). The online card is one line with a small End shift button; the slot timetable only shows when offline.
- **Home tab badge:** the pending-orders count is now amber with dark text, and capped at "9+" so the badge stays small and does not cover the icon. The badge position itself is drawn by Android's native tab bar and cannot be moved from the app.
