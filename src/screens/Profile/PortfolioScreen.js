// PortfolioScreen.js - COMPLETE & IMPROVED
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { StorageAccessFramework } from "expo-file-system";

import { db, now } from "../../services/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../state/AuthContext";
import TextInput from "../../components/TextInput";
import Button from "../../components/Button";
import Header from "../../components/Header";
import { uploadToCloudinary } from "../../services/cloudinary";

export default function PortfolioScreen({ navigation, route }) {
  const { user, profile, loading: authLoading } = useAuth();
  const editItem = route.params?.editItem || null;

  const [desc, setDesc] = useState(editItem?.description || "");
  const [link, setLink] = useState(editItem?.link || "");
  const [file, setFile] = useState(editItem?.image || null);
  const [fileMime, setFileMime] = useState(null);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editItem;

  // -------------------------
  // 📂 Pick Image or PDF
  // -------------------------
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0] || result;
      if (!asset?.uri) return;

      setFile(asset.uri);
      setFileMime(asset.mimeType || "");
    } catch (error) {
      console.error("File pick error:", error);
      Alert.alert("Error", "Failed to pick file");
    }
  };

  // -------------------------
  // 📂 Open PDF
  // -------------------------
  const openPDF = async () => {
    if (!file) return;
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Sharing.shareAsync(file, { mimeType: "application/pdf" });
      } else {
        Linking.openURL(file);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Cannot open PDF.");
    }
  };

  // -------------------------
  // ❌ Remove selected file
  // -------------------------
  const removeFile = () => {
    setFile(null);
    setFileMime(null);
  };

  // -------------------------
  // 📤 Save or Update Portfolio
  // -------------------------
  const submitPortfolio = async () => {
    if (authLoading || !profile) {
      Alert.alert("Please wait", "Loading profile...");
      return;
    }

    if (!desc.trim() && !file) {
      Alert.alert("⚠️ Error", "Please add a description or a file.");
      return;
    }

    if (link && !/^https?:\/\/.+\..+/.test(link)) {
      Alert.alert("Invalid Link", "Please enter a valid URL starting with http or https");
      return;
    }

    setLoading(true);
    try {
      let fileUrl = file;

      // Upload local files only
      if (file && (file.startsWith("file://") || file.startsWith("content://"))) {
        fileUrl = await uploadToCloudinary(file);
      }

      const payload = {
        description: desc.trim(),
        link: link.trim() || null,
        image: fileUrl || null,
        updatedAt: now(),
      };

      if (isEditing) {
        await updateDoc(doc(db, "users", user.uid, "portfolio", editItem.id), payload);
        Alert.alert("✅ Success", "Portfolio updated!");
      } else {
        payload.createdAt = now();
        await addDoc(collection(db, "users", user.uid, "portfolio"), payload);
        Alert.alert("✅ Success", "Portfolio added!");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Portfolio save error:", error);
      Alert.alert("❌ Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f28a47" />
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  const isPDF =
    (fileMime && fileMime.includes("pdf")) ||
    (file && file.toLowerCase().includes(".pdf")) ||
    false;

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? "Edit Portfolio" : "Add Portfolio"}
        onBack={() => navigation.goBack()}
        rightIcon={null}
      />

      <ScrollView style={{ padding: 16 }}>
        <TextInput
          placeholder="Description"
          value={desc}
          onChangeText={setDesc}
          multiline
          style={{ height: 100 }}
        />

        <TextInput
          placeholder="Link (optional)"
          value={link}
          onChangeText={setLink}
        />

        {/* 📂 File Picker */}
        <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
          {file ? (
            isPDF ? (
              <TouchableOpacity onPress={openPDF} style={{ alignItems: "center" }}>
                <Text style={{ color: "#333" }}>📄 {file.split("/").pop() || "Selected PDF"}</Text>
                <Text style={{ fontSize: 12, color: "#777", marginTop: 4 }}>Tap to open</Text>
                <TouchableOpacity onPress={removeFile} style={{ marginTop: 6 }}>
                  <Text style={{ color: "#f44", fontWeight: "bold" }}>Remove</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ) : (
              <View>
                <Image source={{ uri: file }} style={styles.preview} />
                <TouchableOpacity onPress={removeFile} style={{ position: "absolute", top: 6, right: 6 }}>
                  <Text style={{ color: "#f44", fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <Text style={{ color: "#999" }}>+ Pick an image or PDF</Text>
          )}
        </TouchableOpacity>

        <Button
          title={loading ? "Saving..." : isEditing ? "Update Portfolio" : "Add Portfolio"}
          onPress={submitPortfolio}
          disabled={loading}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  filePicker: {
    height: 160,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    position: "relative",
  },

  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
