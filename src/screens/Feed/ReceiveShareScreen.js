// src/screens/ReceiveShareScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import ShareMenu from "react-native-share-menu";

/**
 * Handles incoming share intents and forwards to Compose screen.
 */
export default function ReceiveShareScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleShare = (item) => {
      if (!isMounted) return;
      setLoading(false);

      if (!item) {
        console.warn("⚠️ No shared item received.");
        return;
      }

      console.log("📩 Shared item received (ReceiveShareScreen):", item);

      const { mimeType, data } = item;
      const params = {};

      if (mimeType?.includes("text")) {
        params.sharedText = data;
      } else if (mimeType?.includes("image")) {
        params.sharedImage = Array.isArray(data) ? data[0] : data;
      } else if (mimeType?.includes("video")) {
        params.sharedVideo = Array.isArray(data) ? data[0] : data;
      }

      // ✅ Navigate directly to Compose with the parsed data
      navigation.replace("Compose", params);
    };

    // 🔹 If already received via route param (from useShareHandler)
    if (route.params?.sharedItem) {
      setLoading(false);
      navigation.replace("Compose", route.params.sharedItem);
      return;
    }

    // 🔹 Otherwise check for direct share intent
    ShareMenu.getInitialShare(handleShare);

    // 🔹 Listen for new shares while app is open
    const listener = ShareMenu.addNewShareListener(handleShare);

    return () => {
      isMounted = false;
      if (listener?.remove) listener.remove();
      else ShareMenu.clearListeners?.();
    };
  }, [navigation]); // ✅ no route.params dependency!

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.text}>Preparing shared content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No shared content found.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 16, color: "#444", marginTop: 16, textAlign: "center" },
});
