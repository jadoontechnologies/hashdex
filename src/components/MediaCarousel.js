// src/components/MediaCarousel.js
import React, { useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Video } from "expo-av"; // ✅ new version (expo-av is deprecated)

const { width } = Dimensions.get("window");

export default function MediaCarousel({ media = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();

  const handleScroll = (e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
    );
    setCurrentIndex(index);
  };

  if (!media || media.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onScroll={handleScroll}
        renderItem={({ item }) => {
          // 🧠 Handle both string URLs and object media
          const uri = typeof item === "string" ? item : item?.url;
          const type =
            typeof item === "object"
              ? item?.type
              : uri?.match(/\.(mp4|mov|avi|mkv)$/i)
              ? "video"
              : "image";

          if (!uri) return null;

          return (
            <View style={styles.mediaBox}>
              {type === "video" ? (
                <Video
                  source={{ uri }}
                  style={styles.media}
                  resizeMode="cover"
                  isLooping
                  useNativeControls
                />
              ) : (
                <TouchableOpacity activeOpacity={0.9}>
                  <Image
                    source={{ uri }}
                    style={styles.media}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Pagination Dots */}
      {media.length > 1 && (
        <View style={styles.dotsContainer}>
          {media.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  mediaBox: { width, height: 300 },
  media: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#000",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "#ccc",
  },
  activeDot: { backgroundColor: "#ff6a3d" },
});
