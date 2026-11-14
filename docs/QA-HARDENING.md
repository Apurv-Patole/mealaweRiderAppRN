# Stage 8: QA and hardening

Automated flows are in this folder (`npm run e2e`, needs a dev or preview build on a device and `RIDER_PHONE` / `RIDER_OTP` for a staging rider). The rest is manual and is done by a person with real phones.

## 1. Device matrix

Background location is the part that breaks on some phones, so cover the makers riders actually use. Tick each row for: sign in, attendance selfie, 30 minutes of delivery with the screen off, End shift.

| Device / OS | Pings kept coming with screen off (gaps over 3 min?) | Battery exemption flow works | Notes |
|---|---|---|---|
| Xiaomi / Redmi (MIUI/HyperOS) | | | autostart + "No restrictions" |
| Realme / Oppo (ColorOS) | | | |
| Vivo (Funtouch) | | | |
| Samsung (One UI) | | | "Sleeping apps" list |
| Motorola / Pixel (near-stock) | | | baseline |
| Android 8 or 9 (oldest supported) | | | |
| iPhone, current iOS | | | "Always" location prompt |

Pass mark: gaps over 3 minutes in the server's `riderlocationpings` for the shift are under half of what the Ionic app showed (plan, section 12).

## 2. Battery and data

On one mid-range phone, full charge, one 2-hour delivery shift, screen mostly off:

- Battery used by the app (Settings, Battery): target under 10 percent per 2 hours.
- Mobile data used by the app (Settings, Data usage): note it; pings are about 120 requests per hour while delivering.

## 3. Customer and rider sync scenarios (two phones: rider app and customer app)

| # | Do this | Expect |
|---|---|---|
| 1 | Admin assigns an order to the rider | Rider sees a banner and the new order within 15 s |
| 2 | Rider taps Picked up | Customer order shows picked up within 15 s |
| 3 | Rider starts the delivery ride | Customer map shows the rider; marker moves at least every 30 s |
| 4 | Customer cancels before pickup | Rider is told by push at once and the order shows cancelled |
| 5 | Rider delivers with proof | Customer sees delivered and the proof |
| 6 | Rider goes offline mid-ride, acts, comes back | Queued actions send; nothing is duplicated |
| 7 | Rider logs in on a second phone | First phone signs out |

## 4. Before store release

- Crashlytics: not added yet (needs `@react-native-firebase/crashlytics` and a dev build). Add before the pilot.
- Performance: cold start to Orders under 3 s on a mid-range phone (measure with `adb shell am start -W`).
- Store listing: icon, 4 screenshots (light and dark), short and long description, privacy policy URL covering background location.
