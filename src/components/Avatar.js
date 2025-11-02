import React from "react";
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * 🔹 Avatar Component
 * Props:
 * - uri: Image URL (Cloudinary or local)
 * - size: Diameter of avatar (default 70)
 * - editable: Whether user can change it
 * - onPress: Callback for when pressed
 * - loading: Show loader while uploading
 */
export default function Avatar({ uri, size = 70, editable = false, onPress, loading = false }) {
  return (
    <TouchableOpacity
      activeOpacity={editable ? 0.7 : 1}
      onPress={editable && onPress ? onPress : null}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ff6a3d" />
      ) : uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Ionicons name="person-circle-outline" size={size * 0.7} color="#bbb" />
        </View>
      )}

      {editable && !loading && (
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  placeholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ff6a3d",
    borderRadius: 10,
    padding: 4,
  },
});
