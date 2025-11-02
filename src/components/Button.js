import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";

/**
 * 🔹 Custom Button Component
 * Props:
 * - title: string (text to display)
 * - onPress: function
 * - variant: 'primary' | 'secondary' | 'outline'
 * - disabled: boolean
 * - loading: boolean (optional)
 */
export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}) {
  const backgroundStyle =
    variant === "secondary"
      ? styles.secondary
      : variant === "outline"
      ? styles.outline
      : styles.primary;

  const textColor =
    variant === "outline" ? "#ff6a3d" : "#fff";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        backgroundStyle,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 6,
  },
  primary: {
    backgroundColor: "#ff6a3d",
  },
  secondary: {
    backgroundColor: "#222",
  },
  outline: {
    borderWidth: 2,
    borderColor: "#ff6a3d",
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
});
