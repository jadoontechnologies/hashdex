// -------------------- MediaCarousel.js (FINAL & FULLY FIXED) --------------------
import React, { useState } from "react";
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";

import { Video } from "expo-av";
import ImageViewing from "react-native-image-viewing";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { StorageAccessFramework } from "expo-file-system";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase";

const { width } = Dimensions.get("window");

// -------------------- Helper Functions --------------------

// Make filename safe
const fixName = (name) =>
  name?.replace(/[^a-zA-Z0-9._-]/g, "_") || `file_${Date.now()}.pdf`;

// FINAL FIX → Cloudinary RAW → always enforce correct extension + download mode
const fixCloudinaryPDF = (url, filename) => {
  if (url.includes("cloudinary")) {
    const safe = fixName(filename);
    return url.replace("/upload/", `/upload/fl_attachment:${safe}/`);
  }
  return url;
};

// Firebase
const getPDFUrl = async (firebasePath) => {
  const pdfRef = ref(storage, firebasePath);
  return await getDownloadURL(pdfRef);
};

// Final binary-safe download
const downloadBinaryPDF = async (url, filename) => {
  const safeName = fixName(filename);
  const localPath = FileSystem.cacheDirectory + safeName;

  const result = await FileSystem.downloadAsync(url, localPath); // real binary

  return result.uri;
};

// Open / Share PDF
const openOrSharePDF = async (item) => {
  try {
    let url = item.firebasePath ? await getPDFUrl(item.firebasePath) : item.url;

    url = fixCloudinaryPDF(url, item.name);

    const pdfUri = await downloadBinaryPDF(url, item.name);

    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: "Open PDF with...",
    });
  } catch (err) {
    console.log("Open/share error:", err);
    Alert.alert("Error", "Could not open PDF.");
  }
};

// Save PDF → WORKS 100% (NO 0KB, NO corruption)
const savePDF = async (item) => {
  try {
    let url = item.firebasePath ? await getPDFUrl(item.firebasePath) : item.url;

    url = fixCloudinaryPDF(url, item.name);
    const safeName = fixName(item.name);

    const tempUri = await downloadBinaryPDF(url, safeName);

    if (Platform.OS === "android") {
      const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission denied");

      const newUri = await StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        safeName,
        "application/pdf"
      );

      // read binary → base64 convert
      const base64 = await FileSystem.readAsStringAsync(tempUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(newUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Saved", `"${safeName}" saved successfully`, [
        { text: "Open", onPress: () => Linking.openURL(newUri) },
        { text: "OK" },
      ]);
    } else {
      await Sharing.shareAsync(tempUri, { mimeType: "application/pdf" });
    }
  } catch (err) {
    console.log("Save PDF error:", err);
    Alert.alert("Error", "Could not save PDF.");
  }
};

// -------------------- Video Component --------------------
function VideoItem({ url }) {
  return (
    <Video
      source={{ uri: url }}
      useNativeControls
      resizeMode="contain"
      isLooping
      style={{ width: "100%", height: 300, backgroundColor: "#000" }}
    />
  );
}

// -------------------- Main Component --------------------
export default function MediaCarousel({ media = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isViewerVisible, setViewerVisible] = useState(false);

  if (!media.length) return null;

  const imagesForViewer = media
    .filter((m) => m.type === "image")
    .map((m) => ({ uri: m.url || m.uri }));

  const handlePDF = (item) => {
    Alert.alert(item.name || "PDF", "Choose an option", [
      { text: "Open With…", onPress: () => openOrSharePDF(item) },
      { text: "Download", onPress: () => savePDF(item) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(x / width));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={media}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const url = item.url || item.uri;

          if (item.type === "video") return <VideoItem url={url} />;

          if (item.type === "pdf")
            return (
              <TouchableOpacity
                onPress={() => handlePDF(item)}
                style={styles.pdfContainer}
              >
                <Image
                  source={require("../../assets/icons/pdf.png")}
                  style={styles.pdfIcon}
                />
                <Text style={styles.pdfName}>{item.name}</Text>
                <Text style={styles.pdfHint}>Tap to open/download</Text>
              </TouchableOpacity>
            );

          return (
            <TouchableOpacity
              onPress={() => {
                setViewerVisible(true);
                setCurrentIndex(index);
              }}
            >
              <Image source={{ uri: url }} style={styles.media} />
            </TouchableOpacity>
          );
        }}
      />

      <ImageViewing
        images={imagesForViewer}
        imageIndex={currentIndex}
        visible={isViewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { position: "relative" },
  media: { width, height: 300, backgroundColor: "#000" },

  pdfContainer: {
    width,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },

  pdfIcon: { width: 80, height: 80 },
  pdfName: { marginTop: 8, fontSize: 16, fontWeight: "600" },
  pdfHint: { color: "#666", marginTop: 4 },
});

