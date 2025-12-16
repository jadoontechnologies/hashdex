import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

/**
 * 🔹 Modern Button Component
 * Clean, flat, app-style look (no shadow, rounded, bold font)
 */
export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = true,
}) {
  const getStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      default:
        return styles.primary;
    }
  };

  const textColor =
    variant === "outline"
      ? "#ff6a3d"
      : variant === "secondary"
      ? "#fff"
      : "#fff";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        getStyle(),
        fullWidth && { alignSelf: "stretch" },
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
    justifyContent: "center",
    marginVertical: 8,
    minHeight: 48,
  },
  primary: {
    backgroundColor: "#ff6a3d",
  },
  secondary: {
    backgroundColor: "#333",
  },
  outline: {
    borderWidth: 1.5,
    borderColor: "#ff6a3d",
    backgroundColor: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.4,
  },
});
