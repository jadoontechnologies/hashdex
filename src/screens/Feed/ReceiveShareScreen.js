import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import ShareMenu from "react-native-share-menu";

export default function ReceiveShareScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleShare = (item) => {
      setLoading(false);
      if (!item) return;

      console.log("📩 Shared item received:", item);

      const { mimeType, data } = item;
      let params = {};

      if (mimeType?.includes("text")) {
        params.sharedText = data;
      } else if (mimeType?.includes("image")) {
        params.sharedImage = Array.isArray(data) ? data[0] : data;
      } else if (mimeType?.includes("video")) {
        params.sharedVideo = Array.isArray(data) ? data[0] : data;
      }

      // Navigate to Compose screen with shared data
      navigation.replace("Compose", params);
    };

    // Handle route params first (already navigated)
    if (route.params?.sharedItem) {
      navigation.replace("Compose", route.params.sharedItem);
      return;
    }

    // Initial share
    ShareMenu.getInitialShare(handleShare);

    // New shares while app is open
    const listener = ShareMenu.addNewShareListener(handleShare);

    return () => {
      // Proper cleanup
      if (listener?.remove) listener.remove();
      else ShareMenu.clearListeners?.();
    };
  }, [navigation, route.params]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#888" />
        <Text style={styles.text}>Preparing shared content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No shared content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, marginTop: 20, textAlign: "center" },
});
