import React from "react";
import { TextInput as RNInput, StyleSheet, View } from "react-native";

/**
 * 🔹 Unified TextInput Component
 * Props:
 * - placeholder: string
 * - value: string
 * - onChangeText: function
 * - style: custom styling
 */
export default function TextInput({ style, ...rest }) {
  return (
    <View style={styles.container}>
      <RNInput
        placeholderTextColor="#aaa"
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
    marginVertical: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#222",
  },
});
