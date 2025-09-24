// src/components/HashtagChips.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

/**
 * HashtagChips
 * - Displays a row (or wrap) of clickable hashtags
 * - Can be used inside post cards, compose screen preview, etc.
 *
 * Props:
 * - tags: string[]
 * - onPress: function(tag)
 * - horizontal: boolean (default false)
 */
export default function HashtagChips({ tags = [], onPress, horizontal = false }) {
  if (!tags || tags.length === 0) return null;

  const Container = horizontal ? ScrollView : View;

  return (
    <Container
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {tags.map((tag, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.chip}
          onPress={() => onPress && onPress(tag)}
        >
          <Text style={styles.chipText}>#{tag}</Text>
        </TouchableOpacity>
      ))}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 6,
  },
  chip: {
    backgroundColor: "#eee",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
  },
  chipText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
});
