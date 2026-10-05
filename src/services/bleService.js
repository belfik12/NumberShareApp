import { Platform, PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";
import { BleManager } from "react-native-ble-plx";
import BLEPeripheral from "react-native-ble-peripheral";
import { SERVICE_UUID, CHAR_NAME_UUID, CHAR_PHONE_UUID } from "./bleConstants";

const manager = new BleManager();

const PERMISSION_READABLE = 1;
const PROPERTY_READ = 2;

export async function requestBlePermissions() {
  if (Platform.OS !== "android") return true;

  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(granted).every(
      (g) => g === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

// ---------------- Peripheral: advertise your own profile ----------------

export function startAdvertising({ name, phone }) {
  BLEPeripheral.setName(name.slice(0, 20));
  BLEPeripheral.addService(SERVICE_UUID, true);
  BLEPeripheral.addCharacteristicToService(
    SERVICE_UUID,
    CHAR_NAME_UUID,
    PERMISSION_READABLE,
    PROPERTY_READ,
    name
  );
  BLEPeripheral.addCharacteristicToService(
    SERVICE_UUID,
    CHAR_PHONE_UUID,
    PERMISSION_READABLE,
    PROPERTY_READ,
    phone
  );
  BLEPeripheral.start();
}

export function stopAdvertising() {
  BLEPeripheral.stop();
}

// ---------------- Central: scan for others, read their profile ----------------

export function startScanning(onDeviceFound) {
  manager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
    if (error) {
      console.warn("BLE scan error", error);
      return;
    }
    if (device) onDeviceFound(device);
  });
}

export function stopScanning() {
  manager.stopDeviceScan();
}

export async function readProfile(device) {
  const connected = await device.connect();
  await connected.discoverAllServicesAndCharacteristics();

  const nameChar = await connected.readCharacteristicForService(
    SERVICE_UUID,
    CHAR_NAME_UUID
  );
  const phoneChar = await connected.readCharacteristicForService(
    SERVICE_UUID,
    CHAR_PHONE_UUID
  );

  const name = Buffer.from(nameChar.value, "base64").toString("utf-8");
  const phone = Buffer.from(phoneChar.value, "base64").toString("utf-8");

  await connected.cancelConnection();
  return { name, phone };
}

// Rough signal-strength-to-distance estimate. BLE RSSI is noisy (affected by
// obstacles, phone orientation, case material) — treat this as a coarse
// "closer/farther" hint, not an accurate measurement.
export function rssiToApproxMeters(rssi) {
  if (rssi === null || rssi === undefined) return null;
  const txPower = -59; // approx calibrated RSSI at 1 meter
  const ratio = (txPower - rssi) / 20;
  return Math.round(Math.pow(10, ratio) * 10) / 10;
}
