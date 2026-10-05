import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import {
  requestBlePermissions,
  startScanning,
  stopScanning,
  readProfile,
  rssiToApproxMeters,
} from "../services/bleService";

export default function NearbyScreen() {
  const [people, setPeople] = useState([]);
  const [ready, setReady] = useState(false);
  const seenIds = useRef(new Set());

  useEffect(() => {
    let active = true;

    (async () => {
      const ok = await requestBlePermissions();
      setReady(true);
      if (!ok) return;

      startScanning(async (device) => {
        if (seenIds.current.has(device.id)) {
          setPeople((prev) =>
            prev.map((p) => (p.id === device.id ? { ...p, rssi: device.rssi } : p))
          );
          return;
        }
        seenIds.current.add(device.id);

        try {
          const profile = await readProfile(device);
          if (!active) return;
          setPeople((prev) => [...prev, { id: device.id, ...profile, rssi: device.rssi }]);
        } catch (e) {
          seenIds.current.delete(device.id); // allow retry on next scan result
        }
      });
    })();

    return () => {
      active = false;
      stopScanning();
    };
  }, []);

  const sorted = [...people].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No one broadcasting nearby right now.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const meters = rssiToApproxMeters(item.rssi);
        return (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
            <Text style={styles.distance}>
              {meters ? `~${meters} m away (estimate)` : "Nearby"}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888" },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "600" },
  phone: { fontSize: 14, color: "#333", marginTop: 4 },
  distance: { fontSize: 12, color: "#999", marginTop: 6 },
});
