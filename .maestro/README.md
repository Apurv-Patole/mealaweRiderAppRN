# Maestro E2E — MealaweRiderAppRN

## Setup (Windows-native, no WSL2)

1. Install a JDK 17+ and put `java` on `PATH`.
2. Install the Maestro CLI and put its `bin/` on `PATH`. Check with `maestro --version`.
3. Start an Android emulator or plug in a phone with USB debugging. Maestro drives an app that
   is already installed; it does not boot emulators.
4. Install a dev or preview build of the rider app (`npm run android:staging`).

## Running flows

```bash
# one flow
maestro test .maestro/flows/01-launch-and-login.yaml -e RIDER_PHONE=9999999999 -e RIDER_OTP=123456

# everything (or: npm run e2e)
maestro test .maestro/flows -e RIDER_PHONE=... -e RIDER_OTP=...

maestro studio   # element inspector and recorder
```

`RIDER_PHONE` and `RIDER_OTP` belong to a staging rider with a fixed test code.

## Layout

```
.maestro/
  flows/       01 login, 02 attendance and shift, 03 pickup and delivery,
               04 offline queue, 05 wallet and history, 06 dark mode
  subflows/    sign-in.yaml (fresh install to the Orders tab), reused by every flow
```

## Selectors

Screens are matched by visible text. Two `testID`s exist: `phone-input` and `otp-input`.
Flows 02 and 03 need an assigned order and route for the test rider, a mocked GPS fix at the
kitchen (`adb emu geo fix <lng> <lat>`) and the emulator camera set to a virtual scene.
