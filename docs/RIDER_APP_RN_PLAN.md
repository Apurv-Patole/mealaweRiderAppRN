# Mealawe Rider App: React Native Rebuild Plan

**Project:** MealaweRiderAppRN (new Expo app, sibling of MealaweUserAppRN)  
**Replaces:** `riderAppAI` (Ionic 8 / Angular 19 / Capacitor 7)  
**Backend:** `MealaweServerApp`, reused, plus a few small additive endpoints (section 10); no new infrastructure  
**Status:** Proposal for review. No code written yet.  

---

## 1. Summary

The rider app today is an Ionic/Angular WebView app, and the customer and rider apps find out about order changes separately (for example, a rider is not told when a customer cancels). It works, but its hardest job, tracking a rider's GPS in the background for a whole shift, depends on a custom Java plugin because WebViews get killed by Android battery managers (Realme, OPPO, MIUI). Camera capture has the same problem and needed recovery code.

We already built a modern React Native + Expo app for customers (MealaweUserAppRN). This plan builds the rider app on the same foundation: same stack, same component and theming approach, same build and release pipeline. The rider app keeps its own color palette (section 8). That gives us native performance, a consistent engineering pattern across both apps, and one team skill set instead of two.

**What riders get:** a faster, more reliable app that is easy to use outdoors with one hand, with an explicit End Shift, live earnings, and alerts that arrive even when the app is closed.

**Order sync and live tracking:** both apps keep polling, but smarter: one cheap call with 304 responses, adaptive intervals, push for the moments that matter. The customer app is improved first, so the rider's marker moves smoothly along the road with a proper heading, camera follow and a live ETA, instead of jumping once a minute (section 6). The rider app pings every 30 seconds while delivering.

**What the business gets:** more reliable tracking (feeds pay and customer ETAs), fewer "rider stuck online" cases, one codebase pattern to maintain, and OTA updates for fixes without a store release.

**Estimated effort:** about 10 to 12 weeks to reach a pilot with one React Native developer, one backend developer (in parallel), after about 3 weeks of customer tracking work first (stages C1, S1, C2 in section 9.2). If one person does both app and server, add about 3 weeks. These are planning estimates, to be firmed up after Stage 0.

---

## 2. Rider flow

This is the current flow, kept intact. Changes are marked.

```
Splash
  -> Onboarding (first launch only)
  -> Login (phone) -> OTP verify -> JWT saved
  -> Permissions (location always, camera, notifications, battery)   [improved]
  -> Home

Home (3 tabs): Orders | Route | Profile

1. ATTENDANCE GATE (shift not started)
   Show first kitchen + Navigate button
   Within 100 m of kitchen -> Take Attendance (selfie + GPS)
   -> POST /api/rider/shift/start -> rider is ONLINE, tracking starts

2. PICKUP   Order is "ready" and rider is near kitchen
   -> Start Pickup -> proof photo -> pickup/complete
   -> order = handedOverToDeliveryBoy                      [batch pickup added]

3. DELIVERY   Start Delivery Ride
   -> orders = onTheWay, shift stage = delivery_stage
   -> stops sorted by live distance, Navigate per stop
   -> Delivered -> proof photo -> order = delivered

4. END SHIFT                                               [NEW: explicit button]
   -> shift ends -> incentive calculated
   -> earnings summary for the shift                       [NEW]

Anywhere: Wallet, Salary, Incentives, Attendance history, Order history,
          Cancel request, Support.
```

### Order status the rider moves through

`readyToDelivery -> handedOverToDeliveryBoy -> onTheWay -> delivered`

The server only lets the rider set the last three, and `delivered` needs a proof photo.

---

## 3. Features: what carries over from the current rider app

| Area | Feature | Notes |
|---|---|---|
| Auth | Phone + OTP login, rider registration lead, single active session | Same endpoints (`/authrider/*`) |
| Shift | Slot-aware attendance (Breakfast / Lunch / Dinner), selfie + GPS, proximity gate | Slot windows from `/api/slot-config` |
| Orders | Date + route + cluster search, carry-over orders from earlier slot | Same endpoints |
| Route | Stop ordering, pickup and delivery stages, live-distance sorting | Planner logic ported as pure TypeScript |
| Proof | Pickup and delivery photos with GPS | Native camera, no WebView recovery hacks needed |
| Tracking | Location ping to `/api/rider/location/ping`, offline buffer | Rebuilt natively with Expo (section 5) |
| Wallet | Balance, ledger, monthly salary, 5-condition incentive breakdown | Same endpoints |
| Profile | Edit profile, attendance history, order history | |
| Push | Attendance reminder, order assigned, order ready, cancel update | FCM, same server types |
| Cancel | Rider cancel request with admin decision pushed back | |

---

## 4. Features we reuse from the customer RN app

These already exist in MealaweUserAppRN and can be copied or extracted rather than rebuilt.

| Capability | Customer app source | Use in rider app |
|---|---|---|
| Expo SDK 57, Expo Router, TypeScript | `package.json`, `src/app/` | Same base, file-based routes |
| NativeWind v5 + Gluestack UI v5 | `src/components/ui/` | Same styling approach |
| Theming mechanism (tokens in CSS plus a TypeScript mirror, System / Light / Dark store) | `src/global.css`, `src/theme/`, `themeStore` | Mechanism only. Color values come from the rider app's own palette (section 8) |
| `AppText` typography primitive | `src/components/ui/AppText.tsx` | Same type scale |
| UI kit (Button, Toast, ConfirmDialog, AppSheet, Skeleton, Toggle, ErrorBoundary) | `src/components/ui/` | Reuse as is |
| Lucide icon set | `icons.tsx` | Same icons, no emoji |
| Zustand stores + MMKV + SecureStore | `src/store/`, `src/services/storage/` | Auth, shift, theme |
| HTTP client with auth, error handling | `src/services/http/` | Adapt to rider JWT |
| react-hook-form + zod | `src/features/auth` | Login, register, profile forms |
| Maps (`react-native-maps`, Google) | `src/features/location` | Route and stop maps |
| Notifee + FCM | `src/services/push/` | Alerts, ongoing notification |
| Push channels, sounds | `channels.ts` | Rider-specific channels |
| Crashlytics | `src/services/crashlytics/` | Same |
| Expo Updates (OTA) | `docs/OTA-UPDATES-PLAN.md` | Hotfixes without a store release |
| EAS build profiles, CI/CD guide | `eas.json`, `docs/CI-CD-RELEASE-GUIDE.md` | development / staging / production |
| Force-update screen | `ForceUpdateScreen.tsx` | Replace Capawesome app-update |
| Maestro e2e flows | `.maestro/` | Critical-path tests |
| Haptics | `expo-haptics` | Confirm taps on pickup and delivery |
| Android ongoing notification | `src/features/tracking/` | Reused for the "tracking active" notice |

**Practical approach:** start by copying the theme mechanism (not its colors), `src/components/ui`, `src/services/{http,storage,push,crashlytics}` into the new repo. Once both apps are stable, extract them into a shared package (see section 11, risks).

---

## 5. Native capabilities and what to improve

### 5.1 Native features we will use

| Capability | Library | Replaces in Ionic app |
|---|---|---|
| Background location (foreground service) | `expo-location` + `expo-task-manager` | Custom Java plugin `MealaweLocationTracker` |
| Camera for selfie and proof | `expo-image-picker` / `expo-camera` | `@capacitor/camera` + WebView recovery code |
| Offline ping buffer | `react-native-mmkv` (or `expo-sqlite`) | SQLite table inside the Java plugin |
| Push and rich alerts | `@react-native-firebase/messaging` + Notifee | `@capacitor/push-notifications` |
| Alert sounds | Notifee channel sounds | `native-audio` plugin |
| **Bottom tab bar** | Expo Router **Native Tabs** (`expo-router/unstable-native-tabs`): UIKit tab bar on iOS, Material 3 navigation bar on Android | Ionic `ion-tabs` (a web component) |
| Haptics | `expo-haptics` | `@capacitor/haptics` |
| Navigation hand-off | `expo-linking` to Google Maps / Apple Maps | In-app only |
| Call customer or kitchen | `expo-linking` (`tel:`) | `call-number` plugin |
| Biometric lock for wallet | `expo-local-authentication` | None |
| Network status | `expo-network` | `@capacitor/network` |
| Battery optimization prompt | small config plugin / settings deep link | Capacitor intent |
| Home-screen widget (Android/iOS) | `expo-widgets` | None, optional later |
| Live Activity (iOS) / ongoing notification (Android) | already built for customers | Optional: current stop and next kitchen on the lock screen |
| Error and perf monitoring | Crashlytics + `expo-observe` | Telemetry service |

### 5.2 Improvements over today

**Reliability (highest value)**
1. **Explicit End Shift button.** Today nothing calls `endShift()`, so tracking runs forever and shifts never close. Add End Shift with a confirm dialog, plus the existing server auto-end cron as a safety net. Stop tracking when the shift ends.
2. **Stop tracking when not needed.** Stop pings after End Shift or auto-end. Saves rider battery and server writes.
3. **Offline-first actions.** Queue pickup/delivery status changes and proof uploads when the rider has no signal (basements, lifts) and retry with the same idempotency key. Today only location pings are buffered.
4. **Photo upload resilience.** Compress on device, upload in background with retry, show per-photo status.
5. **Server ping validation.** Reject pings for shifts that are not active (paired server change).

**Rider experience**
6. **Batch pickup.** Select all ready orders at a kitchen and take one proof photo set instead of one flow per order.
7. **One-tap Navigate** to Google Maps with the stop address, and an auto-advance prompt on arrival.
8. **Next-stop card** pinned above the map: customer, address, flat/landmark, call button, payment/COD flag.
9. **Shift summary screen** at End Shift: deliveries, km, on-time %, estimated incentive.
10. **Live earnings strip** on Home: today's incentive progress against each slab (orders, km, on-time, streak, early login).
11. **Permission onboarding that explains why** (always-on location, battery exemption, notifications) with a health check on the Profile tab that shows which permission is missing and a button to fix it.
12. **Language support** (English, Hindi, Marathi to start) via `expo-localization` and i18n keys from day one.
13. **Voice and sound alerts** for new and ready orders, with a mute option.
13a. **Native tab bar** with a live badge for new and ready orders (section 5.3).

**Sync and tracking**
14. **Smarter polling and smooth tracking** (see section 6): adaptive intervals, 304 responses, a changes endpoint, a 30 second ping while delivering, and an animated marker in the customer app. Rider learns of customer cancellations through push plus the changes poll.

**Engineering**
15. Pure-TypeScript, unit-tested route planner and status machine (the repo already runs pure tests with `node --test`).
16. Typed API layer with zod validation of server responses so a bad payload shows an error, not a crash.
17. Maestro e2e for the full delivery flow (attendance to delivered).
18. Staging and production app variants so a rider build can sit next to production on a test phone.

### 5.3 Native tabs (Android and iOS)

The main navigation is a **native tab bar**, not a JavaScript-drawn one. Expo Router's `NativeTabs` renders the platform's own component: a `UITabBarController` on iOS (including the Liquid Glass look on iOS 26) and a Material 3 navigation bar on Android. It feels right on each platform, handles safe areas and accessibility, and costs no extra JS rendering on every screen.

The installed Expo Router (57.0.15) already includes it. The customer app has only a stub (`src/components/app-tabs.tsx`) because its home screen deliberately has no tab bar. The rider app has a real one, so this is the first full use.

**Tabs**

| Tab | Route | Badge | iOS icon (SF Symbol) | Android icon |
|---|---|---|---|---|
| Orders | `(tabs)/orders` | Count of new and ready orders (from the changes poll, section 6) | `shippingbox` | Template PNG, 24 dp |
| Route | `(tabs)/route` | None (a dot while a pickup is waiting, optional) | `map` | Template PNG |
| Wallet | `(tabs)/wallet` | None | `indianrupeesign.circle` | Template PNG |
| Profile | `(tabs)/profile` | Dot if a permission is missing (battery, location always) | `person` | Template PNG |

Wallet moves up from a Profile sub-page to its own tab, because earnings are one of the things riders check most. This is a recommendation; keeping three tabs is also possible. Four tabs stay within Android's limit of five.

**How it is built**
- One file, `src/components/app-tabs.tsx`, defines the whole tab bar. Screens never know about it, so if the Expo API changes (it is still prefixed `unstable_`) there is one place to fix.
- `NativeTabs.Trigger` per tab with `Label`, `Icon` and `Badge`. Icons: SF Symbols on iOS; on Android, PNG template icons exported from the same Lucide icon shapes as the rest of the app so the two platforms match. Lucide's SVG components cannot be used directly inside native tabs, so the icons are exported once as image assets.
- **Colors come from the rider palette (section 8), not defaults:**

| | Light | Dark |
|---|---|---|
| Bar background | `#ffffff` | `#112b1b` |
| Selected icon and label | `#39721e` | `#63ab45` |
| Unselected | `#6d6d6d` | `#a8b3a6` |
| Android selected pill (indicator) | `#dcfce7` | `#0b1f12` |
| Badge background / text | `#b91c1c` / `#ffffff` | `#b91c1c` / `#ffffff` |

  Android label mode is "labeled" (always show text) so riders never guess an icon. The dark-mode indicator color is a starting point to tune on a device.
- **Full-screen flows sit outside the tab group:** order detail, selfie, proof camera, navigation hand-off and cancel request are pushed on the root Stack above the tabs, so the tab bar is hidden during capture and checkout-style steps.
- **Primary action bar:** screens such as Route (Start Pickup, Start Delivery Ride) keep their large action button pinned just above the tab bar, using the content inset the native bar provides, so the button is never covered.
- **Tab bar behavior:** iOS minimize-on-scroll is set to `never`, so the rider never has to scroll back to reach a tab while moving. The bar stays visible.
- **Deep links and push:** `ORDER_READY` and `ORDER_ASSIGNED` open the Orders tab; `ATTENDANCE_REMINDER` opens the attendance screen; tapping the Profile badge goes to the permission health check.
- **Badge source:** the badge count comes from the same store the rider's changes poll (every 15 s) updates, and from push when the app is in the background, so it changes within seconds of a new order or cancellation.

**Risks and fallbacks**
- The API is `unstable_`. Pin the Expo SDK version, keep all tab code in `app-tabs.tsx`, and note it in the upgrade checklist. If it breaks, the fallback is Expo Router's standard JS `Tabs` using the same file and the same tokens.
- Native tabs are checked with `npx tsc` and a bundle export without a device; **real behavior (badges, indicator color, safe areas, Liquid Glass) must be verified on both an Android phone and an iOS device in Stage 2**.
- Android phones with 3-button navigation and iOS devices with a home indicator need a manual check of the pinned action bar.

---

---

## 6. Order sync and smooth live tracking (polling, no new infrastructure)

**Decision:** we do not add sockets, Redis pub/sub or any new real-time service. Both apps keep using REST polling plus the push notifications we already send. The work is to make the polling **smarter and cheaper**, and to make the **rider marker in the customer app move smoothly** instead of jumping. The customer app is improved first (section 9).

### 6.1 How it works today, and where it breaks

**Order changes**

| Event | Customer app learns by | Rider app learns by | Gap |
|---|---|---|---|
| Kitchen marks order ready | Status push (FCM) | `ORDER_READY` push | Works, but push can be delayed or dropped |
| Rider picks up, starts ride, delivers | Status push; open order screen polls | Local state, then REST | Customer can see a stale status |
| **Customer cancels** | Local | **Rider is not told.** Sees it only on the next 30 s poll of an open order page, or a manual refresh | Rider can ride to a cancelled order |
| Admin changes route, address or status | Push or next poll | `ORDER_ASSIGNED` push or refresh | Rider may hold an outdated order |
| Delivery proof photo | Not shown | Uploaded | Customer cannot see proof |
| Status naming | Server names | A different local set (`assigned`, `reachedPickup`, ...) mapped by the app | Two vocabularies drift apart |

**Live rider tracking in the customer app** (read from `src/features/tracking`)

| What happens today | Effect on the customer |
|---|---|
| The rider app sends a location ping at most **once per 60 seconds** | The server's "current location" changes once a minute |
| The customer app polls every **7 seconds**, so most polls return the same point | Wasted calls; nothing new to show |
| The marker glides for a fixed **6.5 seconds**, then sits still for about 50 seconds, then jumps | The marker teleports in bursts instead of moving continuously |
| The glide is a **straight line** between two fixes | The marker cuts across buildings and corners instead of following the road |
| The arrow points to the **destination**, not the direction of travel | The heading looks wrong on curved routes |
| The marker view is re-snapshotted continuously (`tracksViewChanges` left on) | Extra map work on every frame, more battery and jank on low-end phones |
| The camera fits the map once and never follows | The rider can drive out of view |
| The route line is redrawn whole every 30 seconds, ETA jumps in 30 second steps | Route and ETA look jumpy |
| Polling uses `setInterval` with no overlap guard, no pause when the screen is hidden or offline, and a fixed 7 s even when the rider is far or the order is not yet picked up | Overlapping requests on slow networks, wasted battery and data |
| Each poll can make **two calls** (shift location, then the order as fallback), plus the Directions proxy every 30 s | More calls than needed and a higher Google Directions bill |

### 6.2 Smarter polling: the rules

1. **`rev` on every order.** The server adds a revision number that goes up on every order change. Clients ignore anything older than what they already hold, so a late response never overwrites a newer one.
2. **One status vocabulary.** The server returns `statusKey` and a display label with every order, so neither app keeps its own mapping.
3. **One cheap call instead of two.** A new `GET /api/orders/:id/live` returns status, rider position, rider name and phone, and proof photo in one response. It sends an `ETag`; if nothing changed the server answers **304 with no body**, which costs almost nothing on both sides.
4. **One call for all active orders.** A new `GET /api/orders/changes?since=` returns only orders that changed since the last check, for every active order of that customer (or, for a rider, of that shift or route). A customer with several active orders, or a rider with many stops, makes one call, not one per order.
5. **Adaptive intervals** (table in 6.3), not a fixed 7 seconds. Poll faster only when something is moving and someone is looking.
6. **No overlapping requests.** The next poll is scheduled only after the previous one finishes (a timeout chain, not `setInterval`). Errors back off exponentially with random jitter.
7. **Poll only when useful.** Pause when the app is in the background or the screen is not focused, pause when offline, and fetch immediately when the app returns to the foreground or the network comes back.
8. **Push for the moments that matter.** Cancel, assigned, ready, delivered and attendance stay as push notifications (existing FCM). Polling is the catch-up and the live view, push is the nudge. A push carries the `rev`, so an app that already applied that revision ignores it.
9. **Safe writes from the rider.** Rider status updates carry `expectedStatus` and an idempotency key. If the order moved on meanwhile (for example the customer cancelled), the server answers 409 with the current order, and the rider app shows it instead of overwriting.
10. **Server time, not phone time.** Responses carry `serverTime` and the rider's device timestamp, so animation timing is correct even if a phone clock is wrong.

### 6.3 Polling schedule

| Who | Screen or state | Calls | Interval |
|---|---|---|---|
| Customer | Tracking screen, order not yet picked up | `/live` | 20 s |
| Customer | Tracking screen, rider on the way | `/live` (mostly 304) | 10 s |
| Customer | Tracking screen, rider within about 500 m | `/live` | 5 s |
| Customer | Tracking screen, route and ETA | Directions proxy | Only when the rider leaves the route by more than 150 m, or every 90 s (today: every 30 s) |
| Customer | Orders list or home with an active order | `changes?since=` | 30 s while focused |
| Customer | App in background | None; push and the existing background refresh task only | |
| Rider | On shift, app in foreground | `changes?since=` for the route and shift | 15 s |
| Rider | Order detail open | `changes?since=` | 10 s |
| Rider | App in background | Push only (cancel, assigned, ready) | |

These numbers are starting values to tune during the pilot. They are set in one config file in each app.

### 6.4 New and changed endpoints (summary; full list in section 10)

| Endpoint | Role | Purpose |
|---|---|---|
| `GET /api/orders/:id/live` | Customer | Status, rider position, rider name and phone, proof photo, `rev`, `serverTime`; ETag and 304 |
| `GET /api/orders/changes?since=` | Customer | Active orders changed since a revision or time |
| `GET /api/rider/orders/changes?since=` | Rider | Orders on the rider's route or shift that changed, including customer cancellations |
| `POST /api/rider/location/ping` (changed) | Rider | One call updates the order locations too; accepts heading; replies with the next ping interval |

### 6.5 Smooth rider movement in the customer app

The goal is the Zomato and Swiggy feel: the rider's marker moves continuously along the road, turns the way it is travelling, and the map, route and ETA change without jumps.

**What changes, item by item**

| Item | Today | Proposed |
|---|---|---|
| Move duration | Fixed 6.5 s | Equals the real time between the two fixes (from the rider's device timestamps), limited to 2 to 40 s (the rider pings every 30 s). The marker always starts from where it is drawn now, never from the new point |
| Path | Straight line | Follows the **route polyline** between the two fixes. The polyline slice is reduced to at most 8 segments, and each segment is one native marker animation chained one after another |
| Between fixes | Marker stops and waits | **Dead reckoning:** if no new fix has arrived, the marker keeps moving along the route at the last known speed for up to 40 s. It never passes the destination, never moves when speed is under 1 m/s, and then holds and shows "Updated Ns ago" |
| When a fix arrives that disagrees | Marker snaps | The marker eases to the correct place over about 1 s instead of snapping |
| Heading | Bearing to the destination | Direction of travel, from the segment being animated, turned by the shortest angle and smoothed so it never spins |
| Marker graphic | Badge with a View arrow, re-snapshotted constantly | A **top-down scooter image** (like ride apps use), rotated by the map's native `rotation` and `flat`, with `tracksViewChanges` off. Much cheaper to draw |
| Camera | Fits once | **Follow mode:** the camera eases to keep the rider inside the middle of the screen. If the customer pans the map, following pauses and a "Recenter" button appears. When the route is recalculated, the view refits smoothly |
| Route line | Whole route redrawn every 30 s | Only the **remaining** route is drawn and it shortens as the rider advances. It is replaced only when Directions returns a new route |
| ETA | Jumps every 30 s | Counts down locally every second, and eases to the new value when Directions refreshes |
| Status card | Swaps abruptly | Reanimated layout and fade transitions; the progress bar fills with animation; a light haptic on each status change |
| Live indicator | None | A pulsing "Live" dot with "Updated 8s ago". After 75 s without a new fix (two missed pings) the marker greys and the card says "Rider location delayed" instead of showing a false position |
| Arrival | Marker just stops | Within about 100 m the marker eases onto the address and the card shows "Rider has arrived" with a short success animation (Lottie is already installed) |
| Delivered | Screen closes | Card transitions to the delivered state with the proof photo (once the server returns it) |

**How it is built**
- A small hook, `useRunnerAnimation`, in `src/features/tracking`. Input: the stream of fixes (position, speed, device timestamp) and the route polyline. Output: the animation plan for the map component, which it drives with the existing `animateMarkerToCoordinate` calls.
- The math lives in pure functions in `geo.ts` (slice the route between two points, smooth a heading, dead-reckon along a path, ease a correction). They have no React or map dependency, so they are covered by the unit tests the repo already runs with `node --test`.
- The **crash guards in `TrackingMap` stay**: it only animates after the map reports ready, never after unmount, and every pending chained segment is cancelled when the component unmounts or a new fix arrives. These guards exist because Android's marker animation cannot be cancelled and has crashed the app natively in the past.
- The polling scheduler (`createAdaptivePoller`) is a small shared utility: timeout chain, overlap guard, jittered backoff, pause on background or blur or offline, immediate refresh on resume. The rider app uses the same utility for its `changes` poll.
- No new libraries: Reanimated, haptics, Lottie and Google Maps are already in the customer app.
- Behavior on Android and iOS must be checked on real devices (marker animation and `flat` rotation differ slightly between the two map implementations). Until then it is verified only by type checking, bundling and the pure-function tests.

### 6.6 Rider app side of tracking

Smooth movement needs fresher fixes. Today the rider app posts at most once a minute, which is why the customer's marker moves in bursts. With a 30 second ping, each move covers a short, predictable stretch of road, and the animation in 6.5 fills the time between pings.

- **Ping every 30 seconds during delivery.** While the shift is in the delivery stage, the ping interval drops from 60 s to **30 s**. The phone already reads GPS every 5 seconds, so the extra cost is mostly the network call, and it is half of what a 15 s ping would cost in battery and data. Pickup stage and idle stay at 60 s. The server sends the interval in the ping reply (`nextPingMs`), so it can be tuned later without an app release.
- **Heading and speed** are sent with every ping and stored, so the customer app can turn the marker and move it at the right pace.
- **One call, not 1 + N.** The ping updates the location of every `onTheWay` order of that shift on the server side, so the rider app stops posting a separate runner-location call per order.
- The Ionic rider app can adopt the 30 s delivery interval by changing one constant in its native service, so the customer-side improvement does not have to wait for the new rider app.

### 6.7 Calls per minute, before and after (design targets)

| Caller | Today | Proposed |
|---|---|---|
| Customer tracking an order on the way | 8 to 17 calls plus 2 Directions | About 6 `/live` calls, mostly 304 and almost empty, plus about 1 Directions |
| Customer on a list screen with an active order | Varies | 2 `changes` calls |
| Rider ping while delivering | 1 ping plus N location calls per minute | 2 pings per minute (one per 30 s), 0 extra |
| Rider order refresh | Manual or 30 s on one page | 4 `changes` calls per minute on shift |

The 304 responses and the single `changes` call cut data and server work per customer, while the 30 s rider ping doubles ping volume during delivery only. The load test (stage S3) measures this on staging before the pilot.

### 6.8 Failure behavior

| Situation | What the customer or rider sees |
|---|---|
| Network lost | Polling pauses; the last position stays with "Updated Ns ago"; one immediate refresh when the network returns |
| Server slow or erroring | Exponential backoff with jitter; no overlapping requests; marker continues by dead reckoning for up to 40 s, then holds |
| Rider phone offline (no pings) | `serverTime` minus the last fix time shows as "Rider location delayed" after 75 s; ETA keeps counting but flagged |
| Old app versions | Keep using today's endpoints, which are unchanged |
| New endpoints turned off by flag | Apps fall back to today's calls |
| Customer cancels while the rider is offline or in a basement | Push reaches the rider when they have signal; the next `changes` poll also shows it; a later status update gets a 409 |

---

## 7. New libraries worth adding

The customer app already has Reanimated, haptics, Lottie, `react-native-maps`, MMKV, Notifee, FCM and zod. The tracking and polling work in section 6 needs **no new library** in the customer app. These are the additions that make the rider app sturdier. Where marked "Both", we add it to the customer app too so the two stay consistent.

| Library | Adds | Replaces / why | Apps |
|---|---|---|---|
| `@tanstack/react-query` + MMKV persister | Cached server data, retry, refetch on focus and reconnect, offline reads of the last data | One pattern for the order list, wallet and history in the rider app. The tracking screen uses the small shared poller instead, because it needs adaptive intervals and animation control | Rider first, customer app later |
| `@shopify/flash-list` | Fast, low-memory lists | Order and ledger lists on low-RAM phones | Both |
| `expo-image-manipulator` | Resize and compress proof photos on device | Faster uploads on weak networks, smaller storage | Rider |
| `expo-camera` | In-app camera preview with a guide overlay, front camera for selfie | Avoids the camera hand-off that kills the app on some phones | Rider |
| `expo-sqlite` | Durable queue for offline status updates and photo uploads, plus the ping buffer | MMKV is fine for small data; a queue with ordering and retry counts needs a table | Rider |
| `i18next` + `react-i18next` + `expo-localization` | English, Hindi, Marathi | No language support today | Both |
| `expo-keep-awake` | Screen stays on during navigation or photo capture, only when asked | Rider convenience | Rider |
| `expo-audio` | Alert sounds when the app is open (Notifee covers closed) | Replaces the Capacitor native-audio plugin | Rider |
| `react-native-reanimated` + `expo-haptics` + `lottie-react-native` (already installed) | Marker, ETA, status and arrival animations; confirmation feedback | Already present, just used | Both |
| `@sentry/react-native` (optional) | Release health, performance, breadcrumbs of status changes | Crashlytics stays; Sentry adds traces. Skip if cost matters | Both |

**Small shared code, not a library:** `createAdaptivePoller` (timeout chain, overlap guard, jittered backoff, pause on background, blur or offline) and the pure route and animation helpers in `geo.ts`. They are written once in the customer app (stage C1) and copied into the rider app.

**Considered and not recommended now**
- *Sockets, Redis pub/sub, MQTT or a managed real-time service (Socket.IO rooms, Ably, Pusher):* not needed. Polling with 304 responses plus the push we already send is enough for this scale and adds no infrastructure. Revisit only if the load test or the pilot shows polling is not good enough.
- *Mapbox or MapLibre:* Google Maps and its keys are already set up in the customer app. Revisit only if map costs become an issue.
- *Firebase Realtime Database / Firestore for live data:* would add a second source of truth next to MongoDB.
- *Redux or MobX:* Zustand plus React Query is enough.
- *Database change streams:* limited DocumentDB support.

---

## 8. Colors, styling and theming (rider app's own palette)

The rider app keeps **its own palette**, taken from the current rider app (`riderAppAI/src/theme/_palette.scss`, `variables.scss`, `global.scss`). It does not adopt the customer app's colors. From the customer RN app we reuse only the *mechanism* (tokens defined once, mirrored in TypeScript, a theme store with System / Light / Dark), not its color values.

### 8.1 What the rider app uses today

**Brand and surfaces**

| Token | Hex | Where it is used |
|---|---|---|
| `--ion-color-primary` | `#39721e` | Buttons, toolbars, links, selected tab (deep green) |
| primary shade / tint | `#2d5a18` / `#518937` | Pressed state / lighter fills |
| `--mr-brand-1 .. 4` | `#63ab45`, `#518937`, `#39721e`, `#042a33` | Brand gradient, light to dark |
| Accent mint / soft | `#60c8bc` / `#88e5db` | Highlights |
| Accent gold / soft | `#ffb300` / `#ffd674` | Earnings, incentive highlights |
| Light surface / elevated | `#ffffff` / `#f5f6f9` | Page and card |
| Light text strong / muted | `#333333` / `#6d6d6d` | Body and secondary text |
| Dark background | `#0b1f12` | Dark mode page (green-tinted, not pure black) |
| Dark card, toolbar, tab bar | `#112b1b` | Dark mode surfaces |
| Dark text strong / muted | `#f2f4f0` / `#a8b3a6` | Dark mode text |

**Order status colors (already in the app)**

| Status | Hex |
|---|---|
| Assigned | `#3b82f6` (blue) |
| In progress | `#f59e0b` (amber) |
| Delivered | `#63ab45` (green) |
| Cancelled | `#ef4444` (red) |

Layout tokens: 16 px gutter, 12 px card radius, one soft elevation.

### 8.2 Problems found in the current palette

1. **Colors drift on screens.** Beyond the tokens above, the page styles hard-code at least 40 other hex values, many from Tailwind defaults. There are around 8 different greens (`#166534`, `#16a34a`, `#22c55e`, `#2e7d32`, `#14532d`, `#15803d`, `#4ade80`, `#39721e`), about 9 slate greys, and several ambers, reds and blues. The same meaning looks slightly different from screen to screen.
2. **Status colors fail contrast as text on a light background.** Measured against white (4.5:1 is the accessibility minimum for normal text):

| Color | On white | On dark `#0b1f12` |
|---|---|---|
| Amber `#f59e0b` | 2.15 (fails) | 8.02 (passes) |
| Blue `#3b82f6` | 3.68 (fails) | 4.68 (passes) |
| Red `#ef4444` | 3.76 (fails) | 4.58 (passes) |
| Light green `#63ab45` | 2.82 (fails) | 6.10 (passes) |
| Primary `#39721e` | 5.83 (passes) | n/a |
| Tint `#518937` | 4.21 (just fails) | n/a |

   Riders work outdoors in sunlight, so light-mode status text and badges are the weak spot. Dark mode is already fine.
3. **Dark mode only follows the system setting**, with no manual switch.
4. **Palette is defined in three places** (SCSS, CSS variables, ad hoc values in components).

### 8.3 Improved rider palette

Keep every brand color above. Change only what fixes the problems.

**Rule 1: one token per meaning.** Screens use tokens only, never raw hex. Existing ad hoc values map onto the tokens below.

**Rule 2: status colors get two forms.** A *fill* color for dots, bars and icons, and a darker *ink* color for text and badges on light backgrounds. The ink colors are values the app already uses in places (`#1d4ed8`, `#b45309`, `#b91c1c`), so this makes them the standard instead of inventing new ones.

| Status | Fill (dots, bars, icons, dark mode text) | Ink on light (text, badge text) | Soft background (badge, row tint) |
|---|---|---|---|
| Assigned / pickup | `#3b82f6` | `#1d4ed8` (6.70:1) | `#dbeafe` |
| Ready, needs action / in progress | `#f59e0b` | `#b45309` (5.02:1) | `#fef3c7` (new, matches the others) |
| On the way / delivery | `#60c8bc` (existing mint) | `#0f5f56` (7.52:1, new dark mint) | `#d9f4f0` (new) |
| Delivered / done / online | `#63ab45` | `#39721e` (5.83:1) | `#dcfce7` |
| Cancelled / error | `#ef4444` | `#b91c1c` (6.47:1) | `#fee2e2` |
| Offline / idle | `#94a3b8` | `#6d6d6d` (5.17:1) | `#f5f6f9` |
| Money, incentive | `#ffb300` (existing gold) | `#8a5a00` (5.93:1, new dark gold) | `#fff3d1` (new) |

Two new ink values (`#0f5f56`, `#8a5a00`) and three new soft tints (`#fef3c7`, `#d9f4f0`, `#fff3d1`) are proposals for design review; they are darker or lighter versions of colors already in the app, not new hues. Contrast was checked for every ink on both white and its own soft background, and all pass 4.5:1 (the lowest is amber ink on its tint at 4.51:1).

**Rule 3: buttons by theme.**

| | Fill | Text |
|---|---|---|
| Light mode primary button | `#39721e` | `#ffffff` (5.83:1) |
| Dark mode primary button | `#63ab45` | `#0b1f12` (6.10:1) |
| Pressed | shade `#2d5a18` | same |
| Never use | `#63ab45` as text on white (2.82:1) | |

**Rule 4: consolidation map** (what current ad hoc colors become)

| Current ad hoc values | Becomes |
|---|---|
| Any green text or button (`#166534`, `#16a34a`, `#2e7d32`, `#15803d`, `#14532d`) | primary `#39721e` |
| `#22c55e`, `#4ade80` (bright greens) | brand light `#63ab45` |
| Light green tints (`#dcfce7`, `#f0fdf4`) | delivered soft background |
| Slate darks (`#0f172a`, `#1e293b`, `#334155`) | text strong `#333333` (light) / `#f2f4f0` (dark) |
| Slate mids (`#475569`, `#64748b`, `#94a3b8`) | text muted `#6d6d6d` (light) / `#a8b3a6` (dark) |
| Slate lights (`#f8fafc`, `#f1f5f9`, `#e2e8f0`, `#cbd5e1`) | elevated `#f5f6f9` and border `#e5e5e5` |
| Reds (`#dc2626`, `#b91c1c`, `#ef4444`) | cancelled / error tokens |
| Ambers (`#d97706`, `#b45309`, `#fbbf24`, `#f59e0b`) | in-progress tokens |
| Blues and indigo (`#1d4ed8`, `#4f46e5`, `#3b82f6`) | assigned / info tokens |

**Rule 5: dark mode stays green-tinted** (`#0b1f12` page, `#112b1b` cards), which is a good fit for the brand and easy on the eyes at night. Add a manual System / Light / Dark switch in Profile.

### 8.4 Rider-specific styling rules

- **Larger touch targets:** 48 dp minimum; the main action button is 56 dp tall, full width, at the bottom of the screen for one-handed use.
- **Status is never color alone:** always color + icon + label (for example a blue "Assigned" chip with an icon).
- **Contrast first:** body text 14 px or larger; ink colors for text on light surfaces; fills only for non-text marks.
- **Cards:** 12 px radius (rider app's current value), light elevation, 16 px gutter.
- **Motion:** short and functional; riders need speed, not delight.

### 8.5 How it is built

1. Define the tokens once in `global.css` (NativeWind theme) with light and dark values, and mirror them in a small `src/theme/palette.ts` for places that cannot read CSS (navigation theme, status bar, maps, charts).
2. The navigation theme, the native tab bar (section 5.3) and the Gluestack theme read the same tokens, so one change updates everything.
3. A lint rule (or a quick grep in CI) flags raw hex values in screens, so drift cannot return.
4. The customer app keeps its own palette. If the two apps ever need to share tokens, that is a separate decision (see section 11).

---

## 9. Implementation stages

Estimates assume one full-time React Native developer for the rider app, one backend developer for the server stages, and a customer-app developer for the customer stages. The customer tracking work (9.2) goes first. Each stage ends with something demoable.

### 9.1 Rider app stages

| Stage | Name | Duration | Outcome |
|---|---|---|---|
| 0 | Foundation | 1 week | New repo, Expo SDK 57, UI kit and theme mechanism copied, rider palette tokens (section 8) ported and recolored, env config, EAS profiles, CI, HTTP client with React Query, auth store. Verify the rider API contract (including whether requests are encrypted like the customer app). Start the background-tracking spike (including the 30 s delivery ping). |
| 1 | Auth and onboarding | 1 week | Splash, onboarding, phone + OTP login, rider register lead, permissions wizard, FCM token registration. |
| 2 | Shift and attendance | 1.5 weeks | Slot config, attendance gate, selfie capture, shift start, online state, **End Shift**, auto-end handling, **native tab bar** (section 5.3) with Orders, Route, Wallet and Profile, verified on one Android and one iOS device. |
| 3 | Orders and route | 1.5 weeks | Orders list (FlashList), date/route/cluster search, route planner port, stop list and map, stage state machine, carry-over orders. The list refreshes through the rider `changes` poll (needs S2). |
| 4 | Pickup, delivery, proof | 2 weeks | Proximity gate, pickup (single and batch), Start Delivery Ride, delivery flow, proof capture and compression, SQLite offline action queue with idempotency keys, handling of 409 "order changed" responses, navigate and call buttons, cancel request. |
| 5 | Background tracking | 1.5 weeks | Foreground-service location task, 60 s ping, offline buffer and flush, 30 s delivery-stage ping with `nextPingMs`, single-call ping (needs S1), battery and permission health check, tested on Realme/OPPO/Xiaomi/Samsung. **Highest-risk stage.** |
| 6 | Wallet, incentives, profile | 1 week | Wallet, ledger, monthly salary, incentive slabs, live earnings strip, shift summary, attendance and order history, profile edit, biometric lock. |
| 7 | Notifications and polish | 1 week | Push types (cancel, assigned, ready, attendance) with the changes poll as the catch-up, channels and sounds, deep links, dark mode pass, localization (EN/HI/MR), skeletons, empty and error states, accessibility pass. |
| 8 | QA and hardening | 1 week | Maestro full-flow tests including customer-rider sync scenarios, device matrix, battery and data measurement, Crashlytics, performance pass, store listing assets. |
| 9 | Pilot and rollout | 2 weeks | Staged rollout to about 10% of riders, compare against the Ionic app on tracking gaps, crash rate and proof success. Then 100% and retire the Ionic app. |

### 9.2 Customer app and server stages (do these first)

The customer tracking work comes first. It improves what customers see today and does not wait for the rider app. The first stage needs no server change at all.

| Stage | Name | Duration | Outcome |
|---|---|---|---|
| C1 | Customer tracking: smart polling and smooth movement | 1.5 weeks | **Client only, existing endpoints.** `createAdaptivePoller` (timeout chain, overlap guard, jittered backoff, pause on background, blur or offline), adaptive intervals, `useRunnerAnimation` (duration from fix timestamps, movement along the route, dead reckoning, eased corrections, smoothed heading), top-down marker with native rotation, camera follow and recenter, remaining-route polyline, local ETA countdown, Directions only on deviation or every 90 s, Live indicator and stale state, arrival and status transitions, pure-function tests. Limited by the rider's 60 s ping until S1 lands, but already removes the straight-line jump, the wrong heading and the wasted calls. |
| S1 | Server: tracking and sync endpoints | 1 week | `rev` and `statusKey` on orders, `GET /api/orders/:id/live` with ETag and 304, `GET /api/orders/changes?since=`, heading and speed stored and returned with `serverTime`, ping reply with `nextPingMs`, delivery-stage ping interval of 30 s (also set in the Ionic rider app's native service), single-call ping that updates the order locations. Behind a feature flag. |
| C2 | Customer app uses the new endpoints | 0.5 week | Tracking screen and list screens switch to `/live` and `changes`; proof photo shown on delivery; flag allows fallback to today's calls. |
| S2 | Server: rider endpoints | 1 week | `GET /api/rider/orders/changes?since=`, push to the rider on customer cancel or order update, compare-and-set status updates with idempotency keys, shift-active check on ping, ping interval tuning through `nextPingMs`. |
| S3 | Hardening | 0.5 week | Load test on staging (customers polling `/live` and `changes`, riders pinging every 30 s), battery and data measurement on the rider side, tuning of intervals, metrics and alerts, rollback switch. |

### 9.3 Timeline

Customer tracking (C1, S1, C2) is about **3 weeks** with one app developer and one backend developer working side by side, and C1 can ship on its own after week 1.5. The rider app stages (9.1) then run in parallel with S2 and S3, so the rider app plan stays at **about 10 to 12 weeks to pilot** when a separate developer does the rider app. If one person does everything, do C1, S1 and C2 first (about 3 weeks), then the rider app, and add about 3 weeks to the total.

### 9.4 Release milestones

- **Customer tracking release (end of C2):** smooth tracking in a normal customer app release, behind a flag for the server part. Old versions keep working.
- **Internal alpha (end of rider Stage 4):** full delivery flow on a test route; the customer app sees the rider move smoothly on staging.
- **Closed beta (end of rider Stage 6):** tracking and wallet verified with 5 to 10 riders.
- **Pilot (rider Stage 9):** staged production rollout, new endpoints and the faster ping enabled by flag for the pilot group first.

---

## 10. Backend changes needed

The server is shared. All changes are additive and small. There is no new infrastructure: no sockets, no Redis pub/sub, no new services.

### 10.1 New

| # | Change | Where | Why | Stage |
|---|---|---|---|---|
| 1 | `rev` counter on `FoodOrder`, incremented atomically on each update | `foodorder.model.js`, `foodorder.dao.js` | Clients ignore stale or late responses | S1 |
| 2 | `statusKey` and display label in order responses | Order serializers | One status vocabulary for both apps | S1 |
| 3 | `GET /api/orders/:id/live`: status, rider position (lat, lng, speed, heading, device timestamp), rider name and phone, proof URL, `rev`, `serverTime`. Owner check, ETag, 304 when unchanged | New route in the order routes, reading the latest `RiderLocationPing` through the existing `getShiftLocation` logic | One cheap call replaces two; 304 makes polling nearly free | S1 |
| 4 | `GET /api/orders/changes?since=`: the customer's active orders that changed since a `rev` or time | Order routes | One call for all active orders | S1 |
| 5 | `GET /api/rider/orders/changes?since=`: orders on the rider's route or shift that changed, including customer cancellations and admin edits | Rider routes | Rider learns of changes without a manual refresh | S2 |
| 6 | Store `heading` on `RiderLocationPing` and return `speed`, `heading`, `timestamp` and `serverTime` from `getShiftLocation` | `riderShift.service.js`, ping model, ping route | Customer app can turn the marker and time the move | S1 |
| 7 | Ping reply includes `nextPingMs`: 30 s in delivery stage, 60 s otherwise. Server-controlled, so it can be tuned without an app release | `riderShift.service.js` | Fresher fixes at a battery cost riders can live with | S1 |
| 8 | New push types to the rider: `ORDER_CANCELLED_BY_USER`, `ORDER_UPDATED` (existing FCM sender) | `fcm-message-handler.js`, cancel and edit paths | Rider is told right away, polling is the catch-up | S2 |
| 9 | Optional: cache Directions proxy results per origin (rounded) and destination for 20 to 30 seconds | `google-map-api-util.js` | Lower Google Directions cost with many customers | S3 |

### 10.2 Changes to existing behavior

| # | Change | Why | Stage |
|---|---|---|---|
| 10 | `POST /api/rider/location/ping` updates `runner.location` for the shift's `onTheWay` orders itself, so the rider app makes one call instead of 1 + N | Fewer calls; one source of truth for the customer map | S1 |
| 11 | Ping and status endpoints verify `RiderShift.status === 'online'` | Stops stray pings and updates after shift end | S2 |
| 12 | Rider status update accepts `expectedStatus` and an idempotency key; returns 409 with the current order on mismatch. The `expectedStatus` check is a database compare-and-set; the idempotency key reuses `idempotency.util.js` | Safe offline retries; prevents overwriting a cancel | S2 |
| 13 | Keep the `RIDER_LOCATION_UPDATE` FCM push and the Live Activity updates exactly as they are | Still drives the Android ongoing notification and the iOS Live Activity in the background | Ongoing |
| 14 | Keep the `autoEndExpiredShifts` cron running | Safety net when a rider forgets End Shift | Ongoing |
| 15 | Decide: re-enable or remove the commented-out proximity auto-advance (`activateNearbyOrders`) | Remove ambiguity | Anytime |
| 16 | Feature flag for items 3 to 7 and metrics (calls, 304 rate, response time) | Safe rollout and visibility | S1, S3 |

### 10.3 Compatibility

- Old app versions keep using today's endpoints; nothing existing is renamed or removed.
- New fields (`rev`, `statusKey`) are additions.
- With the flag off, apps fall back to today's calls and the 60 s ping.

Reference: `RIDER_APP_SERVER_ARCHITECTURE.md` documents the current contract and the known gaps behind items 11, 13 and 15.

---

## 11. Risks and open decisions

| Risk / decision | Impact | Mitigation / recommendation |
|---|---|---|
| **Background tracking reliability on aggressive OEMs** | Pay (km) and customer ETAs depend on it | Spike in Stage 0, foreground service + battery exemption flow, device matrix in Stage 8 |
| **App ID** | A new ID means a new store listing and riders must reinstall | **Recommend reusing `com.mealawerider.app` and shipping as an update** so riders upgrade in place. Needs the existing signing key and Firebase project. Decision needed before Stage 0 ends. |
| iOS support | Current app is Android-first (iOS project exists) | Build both from one codebase, launch Android first, iOS after pilot |
| Request encryption | Customer app AES-encrypts bodies; need to confirm what rider endpoints require | Confirm in Stage 0 before building the HTTP layer |
| Copy vs shared package for UI kit | Two copies of components drift | Copy now for speed; later extract only the color-neutral components, each app keeping its own palette |
| Native Tabs API is still `unstable_` | A future Expo upgrade could change it | All tab code in one file, pinned SDK, JS `Tabs` fallback with the same tokens (section 5.3) |
| Rider palette changes (new ink and tint colors, consolidating hard-coded colors) | Small visual change for current riders | Design review of section 8.3 before Stage 0 ends; riders see the same greens and status colors, only more readable |
| Rider hardware | Low-end Android phones are common | Test on 3 GB RAM devices, keep bundle lean, avoid heavy animation |
| Rollback | A bad release strands riders mid-shift | Staged rollout, OTA hotfix, keep Ionic app installable during pilot |
| **Polling load on the server** | More customers polling `/live` and `changes`, rider pings doubled during delivery | 304 responses and one `changes` call per user keep each call cheap; intervals set by config; load test in S3 before the pilot; feature flag to roll back |
| **Rider battery and data with a 30 s ping** | Riders on long shifts | The phone already reads GPS every 5 s, only the network call doubles; server-controlled `nextPingMs` can lengthen it; measure battery in the pilot |
| **Marker animation crashes on Android** | Android marker animation cannot be cancelled, and has crashed the app natively before | Keep the existing guards (only after map ready, never after unmount), cancel every pending segment on unmount and on each new fix, test on real devices |
| **Animation shows a position that is not real** | Dead reckoning could mislead if the rider stops or the phone loses signal | Limit to 40 s, stop when speed is under 1 m/s, never pass the destination, show "Updated Ns ago", grey the marker after 75 s |
| Rider language | Hindi/Marathi copy needs review | Get translations reviewed by ops before Stage 7 |

---

## 12. Success measures

- Location-ping gaps over 3 minutes during active shifts: down at least 50% against the Ionic app.
- Shifts left open past their slot (no End Shift): near zero.
- Proof photo upload success on first attempt: above 98%.
- App crash-free sessions: above 99.5%.
- Cold start to Home: under 3 seconds on a mid-range Android phone.
- Order change (status, assignment) visible on the other app within 15 seconds while both apps are open; a customer cancellation reaches the rider by push within seconds.
- Rider told of a customer cancellation before reaching the stop: close to 100%.
- Rider location calls per minute while delivering: from 1 + N to 2 (one ping per 30 s).
- Customer tracking: no marker jump over about 50 m in a single frame, marker keeps moving between pings, and Directions calls per delivery down by at least 60%.
- Customer tracking calls that return 304 (empty): above 60% of polls while the rider is moving.
- Rider support tickets about "app stuck" or "tracking not working": down against the previous month.

---

## 13. What I need from you

1. Approve the plan and the stage order.
2. Decide the app ID (reuse `com.mealawerider.app`, recommended, or new).
3. Confirm Android-first launch with iOS to follow.
4. Name a few riders and an ops contact for the Stage 6 beta and Stage 9 pilot.
5. Confirm the order: customer tracking improvements first (stages C1, S1, C2), then the rider app.
6. Confirm a backend developer for stages S1 to S3 (section 9.2) and that the customer app can take a release for C1 and C2.
7. Approve the 30 second rider ping during delivery (60 seconds otherwise), with a battery check in the pilot.
8. Approve the libraries in section 7 (none new for the customer tracking work).
