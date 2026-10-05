# NearbyShare (Bluetooth, no server)

A prototype Expo/React Native app that shares a user's name and phone number
with nearby devices using Bluetooth Low Energy (BLE) only — no backend, no
database, no internet connection required. Data only ever exists on the two
phones involved, transiently, while they are in Bluetooth range.

## How it works

- **Advertising (peripheral role)**: when you flip "Broadcast" on, your phone
  starts a local BLE GATT server advertising a fixed custom service UUID,
  with "Name" and "Phone" exposed as read-only characteristics.
- **Scanning (central role)**: the Nearby screen scans for devices
  advertising that same service UUID, connects briefly, reads the two
  characteristics, then disconnects.
- Proximity is estimated from Bluetooth signal strength (RSSI) — a rough
  "closer / farther" hint, not a precise distance. Typical BLE range is
  roughly 10-30 meters depending on obstacles and phone orientation.
- Turning broadcasting off calls `stop()` on the peripheral immediately —
  nothing persists anywhere afterward.

## Setup — important: this needs a custom dev build, not Expo Go

BLE peripheral mode (acting as a GATT server) requires native code that Expo
Go does not include. You'll need a **development build** instead:

```bash
npm install
npx expo prebuild        # generates native ios/ and android/ projects
npx expo run:android     # or: npx expo run:ios (requires a Mac + Xcode)
```

Or build one remotely with EAS:
```bash
npx eas build --profile development --platform android
```

Then run `npx expo start --dev-client` and open the app via your dev build
(not the regular Expo Go app).

## Platform caveats worth knowing

- **iOS backgrounding**: Apple restricts what a backgrounded app can
  advertise (no custom service UUIDs in the background in most cases) and
  restricts scanning too. This prototype is built and tested for foreground
  use; background behavior will need more work and possibly a different
  approach (e.g. iBeacon-style advertising) if you need that.
- **`react-native-ble-peripheral`** (used for advertising/GATT server) is a
  smaller, less actively maintained library than `react-native-ble-plx`
  (used for scanning). Worth checking its current GitHub issues before
  relying on it for anything beyond a prototype — peripheral/GATT-server
  support in React Native generally lags behind central/scanning support.
- **Android 12+ permissions**: `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, and
  `BLUETOOTH_CONNECT` are runtime permissions on Android 12+; older versions
  need `ACCESS_FINE_LOCATION` instead (BLE scan results are treated as
  location data by Android). Both are requested in `bleService.js`.

## Before you ship this anywhere real

- **No consent gate**: like the original version, anyone in Bluetooth range
  who runs the scanner can read your name and phone number the moment you
  broadcast. Consider requiring a mutual "connect" tap on both ends (e.g.
  advertise presence/proximity only, and require the other person to
  explicitly request your contact card, which you then approve) rather than
  exposing it to any anonymous scanner.
- **Spoofing**: nothing stops someone from advertising a fake name/number
  under the same service UUID.
- **Auto-timeout**: consider auto-turning-off broadcasting after some period
  so people don't forget they're visible.
