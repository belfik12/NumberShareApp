import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useUser } from "../context/UserContext";
import {
  requestBlePermissions,
  startAdvertising,
  stopAdvertising,
} from "../services/bleService";

export default function HomeScreen({ navigation }) {
  const { profile } = useUser();
  const [broadcasting, setBroadcasting] = useState(false);

  const toggleBroadcast = async (value) => {
    if (value) {
      const ok = await requestBlePermissions();
      if (!ok) {
        Alert.alert(
          "Bluetooth permission needed",
          "Enable Bluetooth permissions to broadcast your profile."
        );
        return;
      }
      startAdvertising({ name: profile.name, phone: profile.phone });
    } else {
      stopAdvertising();
    }
    setBroadcasting(value);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi {profile?.name}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Broadcast my info over Bluetooth</Text>
        <Switch value={broadcasting} onValueChange={toggleBroadcast} />
      </View>
      <Text style={styles.status}>
        {broadcasting ? "Visible to nearby Bluetooth scanners" : "Off"}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Nearby")}
      >
        <Text style={styles.buttonText}>See who's nearby</Text>
      </TouchableOpacity>

      <Text style={styles.footnote}>
        Bluetooth range is roughly 10-30 meters, works with no internet or
        server, and nothing is stored anywhere once you turn this off.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "500", flexShrink: 1, marginRight: 12 },
  status: { fontSize: 12, color: "#888", marginTop: 6 },
  button: {
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footnote: { fontSize: 12, color: "#999", marginTop: 24, lineHeight: 18 },
});
