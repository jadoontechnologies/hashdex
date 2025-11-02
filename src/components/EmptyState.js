import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * 🔹 EmptyState Component (no image needed)
 * Props:
 * - icon: Ionicons name (optional)
 * - title: string → heading (e.g. "No posts yet")
 * - message: string → optional description
 */
export default function EmptyState({
  icon = "chatbubble-ellipses-outline",
  title = "Nothing here yet",
  message = "Start by creating your first post!",
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={70} color="#ccc" style={{ marginBottom: 12 }} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
});
