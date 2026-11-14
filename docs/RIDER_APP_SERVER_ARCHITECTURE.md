# Rider App ↔ Server Architecture

### Shift Lifecycle, Live Location Tracking, and Order Fulfillment in Mealawe's Rider System

**Scope:** `riderAppAI` (Ionic/Angular/Capacitor rider mobile app) and `MealaweServerApp` (Node.js/Express backend), plus the two consumers of rider location data, `mealaweDashboard` (admin) and `MealaweUserApp` (customer), covered in §6.8.

---

## 1. Executive Summary

The rider app and server communicate almost entirely over plain REST/HTTP, not over a live socket connection. A rider's "online" state is not a toggle — it is *derived* from whether a `RiderShift` document exists for that rider, date, and meal slot. Once a shift is started, a background location tracker begins sending GPS "pings" to the server roughly once a minute (subject to movement, staleness, and dedup rules), which are appended to a location history collection. Order assignment happens by delivery route/cluster rather than by per-order dispatch to a specific rider, and the pickup/delivery flow is gated by photo proof and (for pickup) physical proximity to the kitchen.

Three points are worth flagging up front because they affect how the system actually behaves today, not just how it was designed:

- **Ending a shift is effectively dead code** on the client — nothing in the app currently calls it, so location tracking, once started, keeps running indefinitely for the life of the app process.
- **There is no live socket channel** between rider and server for location or order events. Real-time-feeling behavior is achieved through push notifications (FCM) plus short-interval polling, not WebSockets/Socket.IO.
- **Server-side proximity-based auto-advancement of order status is fully commented out.** The code exists but does not run.

These are called out in detail in [Section 11](#11-known-gaps-dead-code-and-behavioral-risks).

---

## 2. System Overview and Tech Stack

### 2.1 Rider App (`riderAppAI`)

| Layer | Technology |
|---|---|
| Framework | Ionic + Angular (standalone components, Angular **signals** for state — no NgRx) |
| Native shell | Capacitor (Android confirmed; iOS project present) |
| HTTP client | Angular `HttpClient`, wrapped by two interceptors (auth token injection, network/online guard) |
| Background location (native) | Custom Capacitor plugin `MealaweLocationTracker` → Android **foreground `Service`** written in Java |
| Background location (web/dev fallback) | `@capacitor-community/background-geolocation` + a JS watchdog timer |
| Local persistence | `@capacitor/preferences` (key-value, JSON-encoded) |
| Push notifications | `@capacitor/push-notifications` (FCM) |
| Photo capture | Native camera / `getUserMedia`, with recovery logic for OEMs (Realme/OPPO/MIUI) that kill the WebView mid-capture |

Base API URL is environment-driven (`environment.serverUrl`): `http://localhost:5000` in dev, `https://api.mealawe.com` in production.

### 2.2 Server (`MealaweServerApp`)

| Layer | Technology |
|---|---|
| Runtime/framework | Node.js, **Express**, run under Node `cluster` for multi-process scaling |
| Primary database | **MongoDB** via **Mongoose** — two connections: a standard MongoDB (`MONGO_DB` env) and an AWS DocumentDB (`DOCUMENT_DB` env, TLS-secured) |
| Cache / sessions | **Redis** (also used as the Express session store) |
| Real-time transport | `socket.io` (support-chat only) **and** raw WebSockets via `express-ws` (order-created broadcasts to kitchen/admin dashboards) — **neither is used for rider location** |
| Push notifications | Google HTTP v1 API via `googleapis` + service-account JSON keys (no `firebase-admin`) |
| Request flow | `route/*.route.js` → `service/*.service.js` → `dao/*.dao.js` → `model/*.model.js`; `util/` holds cross-cutting helpers (auth middleware, FCM senders, cron jobs, geo helpers) |

One structural note: the server has both a `src/route/` (singular) and `src/routes/` (plural) directory. Only `src/route/` is live and wired into `src/config/routeConfig.js`; `src/routes/` contains only an orphaned test file and can be treated as dead.

---

## 3. Authentication and Session

- Login: `POST /authrider/loginRider` triggers an OTP; `POST /authrider/verifyOTP` verifies it via a Passport `local.rider` strategy and checks `isRiderActive(phoneNo)`.
- On success, the server issues a JWT payload `{ _id, type: 'Rider', issuedTime }`.
- The app stores the token via `Preferences` under the key `mealawe.rider.token`.
- Every outgoing request is stamped with `Authorization: Bearer <token>` by `auth.interceptor.ts`; a `401` response triggers a full client-side logout and redirect to `/login`.
- Server-side, `riderAuthMiddleware` (in `src/util/auth-middleware-jwt.js`) validates the JWT via Passport's `jwt` strategy, confirms `user.type === 'Rider'`, and additionally compares the bearer token against a server-stored `oldToken` on the rider record — **this enforces a single active session per rider** (logging in on a new device invalidates the old one).
- `GET /authrider/logout` clears the server-side session marker.

---

## 4. Rider Shift Lifecycle

A "shift" is the unit that ties a rider, a calendar date, and a meal slot (Breakfast / Lunch / Dinner) together. Everything downstream — location tracking, order pickup, KM-based pay calculation — hangs off an active shift.

### 4.1 Starting a shift

**Client flow** (`src/services/shift/shift.service.ts`, `src/app/pages/selfie/selfie.page.ts`):

1. Rider opens the Selfie page; the app checks the current meal-slot window (from `GET /api/slot-config/me`, city-resolved from the JWT, with a hardcoded fallback if that call fails).
2. Rider takes a front-camera selfie (with OEM-kill recovery logic, since some Android camera intents kill the WebView activity).
3. App captures a GPS fix.
4. App builds a `multipart/form-data` request and calls:

   **`POST /api/rider/shift/start`**
   Body: `riderId, photo (file), latitude, longitude, startedAt, routeNo, mealSlot, deviceInfo`

5. On success, the returned `RiderShift` is held in an Angular signal (`ShiftService._shift`) and cached locally under `Preferences` key `mealawe.rider.currentShift`.
6. **This is also the moment live location tracking turns on** — the selfie page calls `pingSvc.start()` immediately after a successful shift-start response.

**Server flow** (`src/service/riderShift.service.js#startShift`, `src/dao/riderShift.dao.js`):

- **Idempotent by design**: the server first checks for an existing shift for `(riderId, date, mealSlot)`. If one already exists, it's returned as-is rather than creating a duplicate — this is also enforced at the database level with a **unique index on `{riderId, date, mealSlot}`**.
- A new `RiderShift` document is created with `status: 'online'`, `stage: 'pickup_stage'`, plus the submitted `startLocation` and `startPhoto`.
- A shift-incentive calculation is kicked off asynchronously (failure here does not fail the shift-start request).

### 4.2 Shift stages and meal slots

A shift progresses through three `stage` values, which double as the rider's coarse "what phase of the shift am I in" state:

| Stage | Meaning |
|---|---|
| `pickup_stage` | Rider is heading to / at the kitchen to collect orders (default on shift start) |
| `delivery_stage` | Rider has started their delivery run (triggered by "Start Delivery Ride") |
| `completed` | Shift has been ended |

Separately, `RiderShift.status` tracks `online` → `offline` (set on end) → `completed`.

Meal slots (Breakfast / Lunch / Dinner) have configurable time windows, fetched from the server per-city and cached client-side with a hardcoded fallback. These windows gate whether a rider is considered "attendance-eligible" for a slot and are what the attendance-reminder push (see [§8.3](#83-push-notifications-fcm)) and cron job key off.

### 4.3 Ending a shift

**`POST /api/rider/shift/end`** — Body: `{ shiftId }`. Server sets `status: 'offline'`, stamps `endedAt`, sets `stage: 'completed'`, and re-runs the incentive calculation.

> **Important:** as of this review, `ShiftService.endShift()` on the client has **no callers anywhere in the app** — there is no button or page wired to invoke it. In practice, riders do not explicitly end a shift from the app UI today; see [§11](#11-known-gaps-dead-code-and-behavioral-risks) for the consequences.

### 4.4 Route/delivery-ride start

Once a rider has picked up their orders, they tap "Start Delivery Ride," which fires two calls in parallel:

1. `POST /api/rider/route/start-delivery` `{ shiftId, latitude, longitude }` — flips the shift's `stage` to `delivery_stage`. (Client note: if this call fails on the network, the app **optimistically flips the local stage anyway** — a deliberate choice to avoid blocking the rider on a flaky connection.)
2. `PUT /api/rider/startDelivery` `{ riderId, routeNo }` — bulk-transitions every order on that rider's route currently in `handedOverToDeliveryBoy` to `onTheWay`, stamps the active `shiftId` onto each of those orders, and notifies customers + admin.

The client then persists `mealawe.rider.deliveryRideStarted = shiftId` so the "Start Delivery Ride" button stays hidden for the remainder of the shift.

---

## 5. Rider "Ready" Status — How It's Actually Modeled

This is worth clarifying explicitly, because "ready" is used to mean two different things depending on context:

**A. Rider online/ready-to-work.** There is **no explicit "go online" / "go ready" toggle or endpoint.** A rider is considered online purely because a `RiderShift` document exists for them for the current date/slot. The client's `ShiftService.isShiftStarted` signal — literally `_shift !== null` — is what every screen checks (e.g. `OrdersPage.isOnline`). The `Rider` model does carry `isOnline?` / `isOnDuty?` fields, but they are **not populated or read anywhere** in the reviewed code — vestigial.

**B. Order ready for pickup.** This is a property of an *order*, not the rider. When the kitchen marks an order `readyToDelivery`, the server looks up the active rider for that order's route and sends a push notification (`ORDER_READY`, see [§8.3](#83-push-notifications-fcm)). The rider app normalizes several raw status strings (`readytodelivery`, `readyfordelivery`) into a `statusKey === 'ready'` UI state. There's a server-side dedup flag (`RiderShift.readyNotifiedAt`) so this push is only sent once per shift rather than once per order.

---

## 6. Live Location Tracking ("Ping") Mechanism

This is the core real-time behavior of the system, and it is implemented almost entirely as periodic HTTP POSTs rather than a persistent connection.

### 6.1 What starts and stops tracking

Tracking starts the moment shift-start succeeds (`pingSvc.start()` called from the selfie page). There is a `LocationPingService.stop()` method that tears down watchers/timers, but in the reviewed code it is essentially unreachable — `OrdersPage.ngOnDestroy()` even has the call to it commented out. Combined with `endShift()` being unwired (§4.3), **the practical behavior is: once a shift starts, GPS tracking runs for the remaining lifetime of the app process**, regardless of whether the rider is mid-delivery, idle, or (in principle) has finished for the day.

### 6.2 Two parallel implementations

The app branches on `Capacitor.isNativePlatform()`:

**Native (Android APK — the real production path):**
The JS layer (`src/services/location/location-ping.service.ts`) delegates to a custom Capacitor plugin, `MealaweLocationTracker`, backed by an Android **foreground `Service`** (`LocationForegroundService.java`). This means GPS acquisition and the HTTP POST both happen in native code, so they **survive the WebView/JS process being suspended or killed** by the OS — which is the main reason a native implementation exists at all (aggressive Android OEM battery managers, e.g. MIUI/ColorOS/Realme, routinely kill background WebViews).

**Web / dev fallback:**
A JS-driven path using `@capacitor-community/background-geolocation`, with a 30-second watchdog timer and app-lifecycle listeners (`resume`/`pause`) to detect when the OS silently killed the watcher and restart it.

### 6.3 Tuning constants

| Constant | Value | Where enforced | Purpose |
|---|---|---|---|
| GPS fix interval | 5,000 ms | Native (Android `LocationForegroundService`) | How often a raw GPS/network fix is requested |
| Minimum GPS distance filter (raw fix) | 0 m | Native | Fixes requested densely regardless of movement, so real path distance can be reconstructed |
| Distance filter (dedup threshold, JS layer) | 10 m | JS (`LocationPingService`) | Minimum movement to consider a fix "new" |
| Heartbeat / hard POST floor | 60,000 ms | Both native and JS | Hard ceiling of **one POST per 60 seconds**, even if the rider is moving continuously |
| Stale threshold | 90,000 ms | JS watchdog | If no fix for 90s, assume the OS killed the watcher and restart it |
| Watchdog tick | 30,000 ms | JS | How often the watchdog checks for staleness |
| Foreground-return debounce | 2,000 ms | JS | Avoids duplicate pings when the app rapidly regains foreground |
| Accuracy floor for accepted fixes (native) | reject if accuracy > 50 m | Native | Filters GPS noise out of the accumulated path distance |
| Jitter floor (native) | ignore sub-5 m movement | Native | Prevents stationary GPS jitter from inflating distance |
| Kitchen pickup proximity gate | 100 m | Client, `environment.kitchenProximityMeters` | Separate from tracking — gates whether "Start Pickup" is even allowed (§7.3) |

### 6.4 Conditions gating whether a ping is actually sent

On the **client**, a ping is only POSTed if all of the following hold:

1. At least 60 seconds have passed since the last successful POST (hard dedup).
2. **There is an active shift** (`shiftId` present) — if not, GPS fixes still update local UI signals (speed/accuracy display) but nothing is sent to the server at all.
3. Background location permission has been granted; if the rider only granted "while using the app" (Android 11+), the app surfaces a toast asking them to upgrade it, since the OS won't silently escalate that grant.
4. On returning to the foreground, the app skips forcing a fresh GPS fix if a ping was already sent recently and the cached fix isn't yet stale (>90s).
5. If the server responds with a rate-limit message (`{ msg: "Please retry after some time!" }`, still HTTP 200), the client pushes its own "next allowed ping" time forward by another full interval, i.e. it honors server-side backpressure even though the server currently doesn't send this response from the reviewed ping handler.

On the **native Android service**, POST throttling is a straight 60-second floor regardless of the JS-side distance filter (the 10 m distance filter is passed down for API compatibility but is **not currently used** to gate POST frequency in the native code — only the time floor is). Dense 5-second GPS fixes are still used internally to accumulate real path distance (`segmentMeters`) between POSTs, filtering out low-accuracy and sub-jitter movement first.

**Offline resilience (native only):** if a POST fails (no connectivity), the payload is written to a local SQLite table (`pending_pings` in `mealawe_location_buffer.db`), capped at 500 rows (oldest dropped first). On the next successful POST, buffered rows are flushed oldest-first in batches of 50, re-sent with whatever the *current* auth token is (so a token rotation while offline doesn't invalidate the backlog), and flushing stops at the first renewed failure.

**Battery optimization:** the app requests exemption from Android's battery optimization (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) during onboarding, and the native service holds a partial wake lock for the duration of active tracking, releasing it when tracking stops. A persistent low-importance notification ("Mealawe is tracking your location for active deliveries") is shown while the foreground service runs, as required by Android for foreground location services.

### 6.5 The ping payload

```
POST /api/rider/location/ping
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "riderId":       "<DeliveryPartner _id>",
  "shiftId":       "<RiderShift _id>",
  "lat":            <number>,
  "lng":            <number>,
  "accuracy":       <number, meters>,
  "speed":          <number, m/s>,
  "timestamp":      "<ISO-8601>",
  "stage":          "pickup_stage" | "delivery_stage",
  "segmentMeters":  <number>   // native only — accumulated real-path distance since the last ping
}
```

### 6.6 Server-side ingestion and validation

Handled by `POST /api/rider/location/ping` → `riderShift.service.js#processLocationPing`:

1. **Required-field check** (route layer): `riderId, shiftId, lat, lng` must be present, or the request is rejected with a 402.
2. **No re-validation that the shift is still active** — the service does not look up the `RiderShift` and check its `status`. Any syntactically valid `shiftId` is accepted, and pings are accepted in both `pickup_stage` and `delivery_stage`.
3. **No server-side minimum time/distance throttle on acceptance** — every well-formed ping is written; throttling is entirely a client-side/native concern (§6.4).
4. **Anti-fraud distance validation** — this is the one substantive validation the server does perform, and its purpose is protecting **pay-bearing kilometer totals**, not gating whether the ping itself is stored:
   - The server computes the straight-line (haversine) distance between this ping and the last stored ping for the shift.
   - The effective distance credited is `max(client-reported segmentMeters, straight-line distance)` — this covers cases where the app was killed and segment tracking restarted.
   - That effective distance is then **capped** at `elapsed_seconds × 30 m/s` (≈108 km/h) — an explicit anti-spoofing ceiling so a tampered or jittery GPS reading can't inflate a rider's paid kilometers.
   - The resulting delta is added to `RiderShift.pickupKm` or `RiderShift.deliveryKm` (based on `stage`) and to `RiderShift.totalActualKm`.
5. The response is always `{ saved: true }` — the client never receives an error for a "late" or "duplicate" ping. (The client's `sendPing()` does contain a branch that reacts to a `{ msg: "Please retry after some time!" }` rate-limit response — but the server, as read here, never actually sends that response from this handler. It's dead defensive code on the client with no live server counterpart today.)
6. There is a code path intended to auto-advance nearby handed-over orders to `onTheWay` based on proximity to the rider (`activateNearbyOrders`, 300 m radius) when `stage === 'delivery_stage'` — **this is currently fully commented out** and is a no-op today (see [§11](#11-known-gaps-dead-code-and-behavioral-risks)).

### 6.7 Where the live location is actually stored

This is the crux of "where does rider location get saved":

**Primary store — `RiderLocationPing` collection (append-only history, never overwritten).**

```
RiderLocationPing {
  riderId:    ObjectId → DeliveryPartner   (required)
  shiftId:    ObjectId → RiderShift        (required)
  lat, lng:   Number                       (required)
  accuracy:   Number
  speed:      Number
  timestamp:  Date                          (required)
  stage:      'pickup_stage' | 'delivery_stage' | 'completed'
  createdAt / updatedAt: Date (timestamps)
}
Indexes: {shiftId: 1, timestamp: 1}, {riderId: 1, timestamp: -1}
```

Every accepted ping is a fresh `RiderLocationPing.create(...)` call — nothing here is ever updated in place. "Current location" for a rider is derived, not stored: the server finds it by querying this collection for the most recent document by timestamp (`findLastPing` / `getLatestPingForShift`). A source-code comment in the DAO explicitly documents that an earlier design *did* keep a single denormalized "current location" field directly on `RiderShift`, and it was deliberately replaced by always reading the latest `RiderLocationPing` row instead.

**Secondary, order-scoped location fields (single-value, overwritten):**

| Field | Written by | Behavior |
|---|---|---|
| `FoodOrder.runner.location {lat, lng}` | `POST /api/rider/updateRunnerLocation` (called automatically after every successful ping, for each order currently `onTheWay`/`outfordelivery`) | Overwritten each time — this is what feeds the customer-facing "track your rider" screen |
| `FoodOrder.runnerLocation` | `updateActiveOrdersRunnerLocation` DAO function | Defined and exported, but **not called from anywhere** in the codebase — dead |
| `RiderShift.startLocation`, `RiderShift.deliveryRideStartLocation`, `RiderShift.pickupGps`, `RiderShift.proofGps` | Shift-start / start-delivery / pickup / delivery-proof endpoints | One-off snapshots at specific lifecycle moments, not continuously updated |
| `OrderTracking.pickupLocation`, `OrderTracking.deliveryLocation` | Pickup-complete / delivery-complete | Per-order snapshot at the moment of that specific milestone |

**In short:** there is one true live-tracking table (`RiderLocationPing`, history), and several point-in-time snapshot fields scattered across `RiderShift`/`FoodOrder`/`OrderTracking` that exist for specific business events (start of shift, start of delivery run, proof-of-pickup, proof-of-delivery) rather than continuous tracking.

### 6.8 How the location reaches other parties

There is **no push/broadcast socket path for location** anywhere in the system — both consumers below poll REST on a timer. This was verified directly against `mealaweDashboard` and `MealaweUserApp`, not just inferred from the server side, and it corrects an assumption from an earlier pass of this document (see the callout after the customer app entry).

- **Admin dashboard** (`mealaweDashboard`): `order-card.component.ts` — for an order whose `orderstatus` is `handedOverToDeliveryBoy` or `onTheWay`, opening the "Route Info" tab starts a **30-second `setInterval` poll** (`startMapPolling`, stopped when the tab closes). Each tick calls `apiMainService.getShiftLocation(shiftId)` → **`GET /api/rider/shift/location/:shiftId`** — exactly the endpoint described in §6.6/§9, joining `RiderShift` with the latest `RiderLocationPing`. The response's `data.currentLocation {lat, lng, updatedAt}` is what the Google Maps marker plots. **Fallback:** if the order has no `shiftId` yet, it instead polls `GET /api/getFoodOrder/:id` and reads `order.runner.location` (the point-in-time field from §6.7, not the ping history). Socket.IO is present in this app's dependencies but is wired only to the admin/user support-chat feature — nothing to do with rider tracking.

- **Customer app** (`MealaweUserApp`): `map-route-display.component.ts` — while its live-tracking map screen is open (and only at "big" screen size), a **60-second `setInterval` poll** (`updateRunnerPosition`) calls either `GET /api/trackdeliveryTask/:id/:partner` (when a delivery-task ID is known) or `GET /api/getFoodOrder/:id`, and reads **`.runner.location`** from whichever response comes back — the same overwritten, order-scoped field from §6.7, not `RiderLocationPing`. The marker is snapped onto the pre-drawn route polyline before being plotted. Socket.IO exists in this app too, again only for support chat (`/support-chat` namespace).

> **Correction to the design described elsewhere in this document:** §6.6/§8.3 describe the server sending a throttled (15s) data-only FCM push of type `RIDER_LOCATION_UPDATE` with `{orderId, orderNo, lat, lng}` whenever `FoodOrder.runner.location` updates on an `onTheWay` order. That push **is sent by the server**, but direct inspection of `MealaweUserApp` found **no code that listens for it**. Its only push-received handler (`permission-util.service.ts`) branches solely on `notification.title === 'Order Status'` and never reads `notification.data` — no lat/lng is ever extracted from a push. So today, the customer's live map is driven **entirely by the 60-second REST poll described above**, and it only updates while that map screen is actually open — nothing updates in the background, regardless of what the server pushes. The `RIDER_LOCATION_UPDATE` push, as far as the client is concerned, currently goes nowhere.

- `/api/rider/location/ping` itself never emits a socket event or push on success.

---

## 7. Order Assignment and Pickup Flow

### 7.1 Assignment is by route, not by order

Orders are **not** dispatched to a specific rider individually by default. Instead:
- Each rider profile (`DeliveryPartner`) carries a static `routeNo` (their assigned delivery territory/route) and a list of `clusters`.
- An admin/dashboard action, `POST /api/updateRouteInfo`, assigns a `routeNo`/`routeRank` to an order.
- The server then looks up whichever `DeliveryPartner` is currently `isActive` for that `routeNo` and sends a debounced FCM (`ORDER_ASSIGNED` — see §8.3).
- The rider app fetches its own work by querying orders filtered by its `routeNo` + cluster list + date range (`searchRiderFoodOrderList`, `getOrdersDashboard`), not by looking up orders where `riderId` equals itself — in fact, `FoodOrder.riderId` is frequently `null` in practice; the route/cluster match is the real assignment mechanism.
- `FoodOrder.shiftId` is the field that concretely ties an order to a specific rider-shift **instance** (used for the dashboard map and incentive/KM calculations) — but it's populated at *pickup* or *delivery-ride-start* time, not at assignment time.

### 7.2 Order status state machine

`FoodOrder.orderstatus` values, in roughly chronological order:

```
paymentInitiated → paymentInprogress → paymentFailed
placed → accepted → preparing → readyToDelivery → deliveryBoyAssigned
→ handedOverToDeliveryBoy → onTheWay → delivered
(or) cancelledByUser / cancelledByKitchen / rejectedByKitchen / autoCancelled / refundCompleted
```

Every transition is appended to `FoodOrder.statusHistory[]` — `{orderstatus, updatedOn, updatedBy, updateByType}` — giving a full audit trail. The server explicitly restricts which statuses the **rider** is allowed to set:

```
RIDER_TRANSITION_STATUSES = { handedOverToDeliveryBoy, onTheWay, delivered }
```

Setting `delivered` additionally requires a `proofImageUrl` to be present, enforced server-side (not just client-side). Transitions are wrapped in a process-lock (`processLockService`) keyed on the order ID, to prevent two concurrent requests from racing on the same order's status.

### 7.3 Pickup flow

1. Rider opens the order detail page. Before allowing "Start Pickup," the client computes the haversine distance between the rider's last known GPS fix (from the location-ping service, not a fresh request) and the order's `kitchenGeolocation`. If it's farther than **100 meters** (`environment.kitchenProximityMeters`), the action is blocked with a toast. This same check is re-applied when the camera actually opens.
2. Rider takes a proof photo → `POST /api/rider/pickup/proof/:orderId` (multipart, includes GPS).
3. Client then calls `POST /api/rider/pickup/complete` `{orderId, riderId, shiftId, proofUrl, latitude, longitude}`, which:
   - Stamps the active `shiftId` onto the `FoodOrder` (`setOrderShiftId`).
   - Upserts an `OrderTracking` document keyed by `(orderId, shiftId)`, recording `pickupCompletedAt`, `pickupProofPhoto`, and `pickupLocation`.
4. Client then flips the order status to `handedOverToDeliveryBoy` via `updateFoodOrder`.
5. Multiple orders can be handed over together (the client supports batching this via `forkJoin`).

### 7.4 Delivery flow

1. Once the rider taps "Start Delivery Ride" (§4.4), orders on the route move to `onTheWay`.
2. At the customer's door, rider marks delivery: `POST /api/rider/delivery/proof/:orderId` (multipart photo + GPS), followed by setting `orderstatus: 'delivered'` with the resulting `proofImageUrl` attached — server-enforced as described in §7.2.
3. While an order-detail page is open, the client polls `GET /api/getFoodOrder/:id` every **30 seconds** to detect server-side status changes it didn't originate itself (e.g., an admin override) and surfaces a toast.

### 7.5 Cancellation

A rider who cannot fulfill an assigned order submits `POST /api/riderCancelRequest`, which notifies admin. Admin resolves it via `PUT /api/riderCancelRequests/:id/resolve`, and the decision (`resolved` / `cancelledOrder` / `assignedThirdParty` / `assignedOtherRider`) is pushed back to the rider via FCM (`CANCEL_UPDATE`).

---

## 8. Real-Time Communication Channels

It's worth being precise here because "how does everything work" naturally implies sockets, and this system deliberately doesn't use them for the rider-facing flows.

### 8.1 Socket.IO — support chat only

A Socket.IO server is initialized on path `/support-chat-socket`, namespace `/support-chat`, authenticated via a JWT passed in the socket handshake. It explicitly **rejects rider connections** — only `type: 'User'` (customer) and `type: 'Admin'` tokens are accepted. Rooms are `admin-lobby` (all admins) and `chat:<sessionId>` (per support conversation). This channel is entirely unrelated to location or order flow.

### 8.2 Raw WebSocket (`express-ws`) — kitchen/admin order-created notifications

A separate, lower-level WebSocket layer (mounted at `/websocket/orderSocket`) is used to notify kitchen/admin dashboards when new orders are placed. It has no concept of rider-specific rooms and is not touched anywhere in the rider-shift or location-ping code paths.

### 8.3 Push notifications (FCM)

This is the actual "real-time-feeling" channel for rider-facing events. The client registers its FCM token via `POST /api/saveFcmToken {profileId, fcmToken, type: 'RIDER'}`, and the server sends data-only messages of these types:

| Push type | Sent when | Client behavior |
|---|---|---|
| `ATTENDANCE_REMINDER` | Cron job fires near the start of each meal-slot window for riders who haven't started a shift yet | Opens the Selfie page to prompt shift start |
| `ORDER_ASSIGNED` | An order's route is assigned/updated to match this rider's active route (debounced 10s per rider) | Plays an audio alert, toasts, refreshes the order list |
| `ORDER_READY` | Kitchen marks an order `readyToDelivery` (once per shift, deduped via `readyNotifiedAt`) | Toasts "order ready for pickup," refreshes |
| `CANCEL_UPDATE` | Admin resolves a rider's cancellation request | Toasts the outcome, refreshes |
| `RIDER_LOCATION_UPDATE` | Sent to the **customer**, not the rider, throttled to once every 15s while an order is `onTheWay` | **Verified: nothing.** `MealaweUserApp`'s push handler doesn't read `notification.data` at all (see §6.8) — this push currently has no client-side consumer. The live map instead polls REST every 60s. |

### 8.4 Polling, used precisely because there's no socket

In the absence of a live channel, the app relies on:
- A 30-second poll of a single order's status while its detail page is open (§7.4).
- Periodic dashboard refreshes on the Orders page.
- `appStateChange`/`resume` lifecycle hooks that force a data refresh when the app returns to the foreground (also used to catch missed pushes on OEMs that throttle background notification delivery).

---

## 9. Data Model Reference

| Model | Key fields | Role |
|---|---|---|
| `DeliveryPartner` | `name, phoneNo (unique), routeNo, clusters[], isActive, fcmToken`, KYC/bank fields | Rider profile and static route assignment. **No location or live status fields.** |
| `RiderShift` | `riderId, date, mealSlot, status, stage, startLocation, startedAt, endedAt, pickupKm, deliveryKm, totalActualKm, deviceInfo, readyNotifiedAt` | One document per rider/date/meal-slot (unique index); the backbone of "is this rider working right now" |
| `RiderLocationPing` | `riderId, shiftId, lat, lng, accuracy, speed, timestamp, stage` | Append-only GPS history; the actual live-tracking data store |
| `FoodOrder` | `orderstatus, statusHistory[], routeNo, routeRank, shiftId, runner.location, pickupProofUrl/GPS, proofImageUrl/GPS` | The order itself and its fulfillment audit trail |
| `OrderTracking` | `(orderId, shiftId)` unique, `pickupCompletedAt/Location, deliveryStartedAt, deliveredAt/Location, actualKm` | Per-order-per-shift milestone snapshots |

---

## 10. Cron Jobs Touching Riders

Scheduling is done via a manual polling loop (`setInterval`, every 15 minutes, master process only) rather than a cron library:

- **Attendance reminder** — fires within a ~15-minute window at the start of each meal slot, pushing `ATTENDANCE_REMINDER` to riders with no shift yet for that slot.
- **Daily late-order summary** — freezes the day's lateness report late at night; unrelated to location.

No cron job currently checks for stale location data, auto-ends inactive shifts, or auto-advances order status by proximity — the proximity-based logic exists in code but is disabled (§11).

---

## 11. Known Gaps, Dead Code, and Behavioral Risks

These are worth documenting because they materially change how the system behaves versus how it might appear to be designed:

1. **`ShiftService.endShift()` is unwired on the client.** No page or button calls it. Practical effect: riders never explicitly end a shift, `RiderShift.status` never transitions to `offline` via normal use, and — combined with point 2 — location tracking has no natural stop condition during the day.
2. **`LocationPingService.stop()` is effectively unreachable.** The one place it would make sense to call it (`OrdersPage.ngOnDestroy`) has the call commented out. Once tracking starts at shift-start, it runs for the life of the app process.
3. **Server-side proximity auto-advancement is fully commented out.** `activateNearbyOrders` (meant to auto-flip nearby handed-over orders to `onTheWay` when the rider gets within 300m) exists, including its supporting DAO helper functions, but the calling code is disabled — currently a no-op wrapped in a try/catch.
4. **The `/api/rider/location/ping` endpoint does not re-verify the shift is active.** Any structurally valid `shiftId` is accepted; there's no check against `RiderShift.status`.
5. **Two dead/duplicate implementations exist and should not be confused with the real ones:**
   - Client: `src/services/location/location.service.ts` (posts to a *different*, non-existent-in-practice endpoint, `/api/rider/location`, not `/api/rider/location/ping`) — referenced only by its own test spec.
   - Server: `foodorder.dao.js#updateActiveOrdersRunnerLocation` — defined and exported but never called.
   - Client: `src/services/orders/proof-upload.service.ts` (`/api/uploadOrderProofImage/:orderId`) — superseded by `TripApiService`'s pickup/delivery proof endpoints.
6. **The `RIDER_LOCATION_UPDATE` FCM push is sent by the server but has no consumer.** The server throttles and sends it correctly (§6.6/§8.3), but `MealaweUserApp`'s push handler never reads `notification.data`, so the payload is dropped on arrival. The customer's live map works anyway, but purely via its own 60-second REST poll (§6.8) — meaning it never updates while the app is backgrounded, and the "push for instant background updates" design intent visible in the server code isn't actually realized client-side today.
7. **The admin dashboard's live map silently falls back to stale-ish data when an order has no `shiftId` yet.** `order-card.component.ts` prefers `GET /api/rider/shift/location/:shiftId` (the `RiderLocationPing` history), but if `order.shiftId` is unset it falls back to `GET /api/getFoodOrder/:id` and reads the order's `runner.location` snapshot instead — the same field the customer app polls. Since `shiftId` is only stamped onto an order at pickup-complete/delivery-ride-start (§7.1), any admin viewing an order before that point is looking at whatever `runner.location` last held, not a real-time position.
8. **The WebSocket base URL (`environment.wsBaseUrl`) is configured in every environment file but never actually used** — no `WebSocket`/`socket.io-client` connection is opened anywhere in the app. If future work assumes a live socket exists for order/location updates, it doesn't; today that's push + polling.
9. **`Rider.isOnline`/`isOnDuty` model fields are vestigial** — declared in the client-side model, never populated or read.
10. **Native ping throttling ignores the JS-configured distance filter** — the Android foreground service throttles POSTs purely by time (60s), not distance; the `distanceFilterM` parameter is accepted for interface compatibility but not enforced natively (this is called out directly in a code comment).

None of these are described as urgent defects by the code itself — several look like intentional simplifications or half-migrated features — but they're the kind of detail that matters when reasoning about "why is a rider's shift still showing as online" or "why didn't the order auto-advance when the rider arrived."

---

## 12. End-to-End Flow Summaries

### 12.1 Shift start → tracking begins

1. Rider opens Selfie page → takes photo → GPS fix captured.
2. `POST /api/rider/shift/start` (multipart) → server creates/returns `RiderShift` (idempotent per rider/date/slot).
3. Client caches the shift locally and calls `pingSvc.start()`.
4. Native foreground service (or JS fallback) begins requesting GPS fixes every ~5s and POSTing at most once every 60s (or on >10m movement, subject to the 60s floor) to `/api/rider/location/ping`.

### 12.2 Steady-state location ping loop

1. GPS fix acquired (native: every 5s; filtered for accuracy/jitter).
2. Real-path distance accumulated locally (`segmentMeters`).
3. Every ≥60s (and not sooner), a POST fires with `{riderId, shiftId, lat, lng, accuracy, speed, timestamp, stage, segmentMeters}`.
4. Server appends a `RiderLocationPing` document; computes a fraud-capped distance delta and increments `RiderShift.pickupKm`/`deliveryKm`/`totalActualKm`.
5. Client (JS layer), on every successful ping, also POSTs `/api/rider/updateRunnerLocation` for each order currently `onTheWay`, overwriting `FoodOrder.runner.location`.
6. If that order is `onTheWay`, the server sends a throttled `RIDER_LOCATION_UPDATE` FCM — but `MealaweUserApp` never reads it (verified, §6.8). The customer's map instead independently polls `GET /api/trackdeliveryTask/:id/:partner` (or `GET /api/getFoodOrder/:id`) every 60s, reading the same `runner.location` field, only while its tracking screen is open.
7. Admin dashboard (`mealaweDashboard`), separately, polls `GET /api/rider/shift/location/:shiftId` every 30s while its "Route Info" tab is open, to read the latest `RiderLocationPing`.
8. If offline (native path), the ping is buffered to local SQLite and flushed once connectivity returns.

### 12.3 Pickup

1. Kitchen marks order `readyToDelivery` → server finds the active rider for that route → `ORDER_READY` push.
2. Rider opens the order; client checks GPS-to-kitchen distance (≤100m) before allowing pickup to start.
3. Proof photo → `POST /api/rider/pickup/proof/:orderId`.
4. `POST /api/rider/pickup/complete` → stamps `shiftId` onto the order, upserts `OrderTracking` with pickup location/time.
5. Order flipped to `handedOverToDeliveryBoy`.
6. Rider taps "Start Delivery Ride" → shift `stage` becomes `delivery_stage`; all handed-over orders on the route flip to `onTheWay`.
7. At delivery: proof photo → order flipped to `delivered` (proof required, server-enforced).

---

*Compiled from a direct code review of `riderAppAI`, `MealaweServerApp`, `mealaweDashboard`, and `MealaweUserApp` as of 2026-08-21 (the latter two added in a follow-up pass to confirm, rather than infer, how rider location is actually consumed downstream — see §6.8 and §11 items 6-7). File/function references throughout reflect the reviewed source; treat this as a snapshot rather than a permanently authoritative reference if the code changes.*
