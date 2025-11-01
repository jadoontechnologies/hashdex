import React, { useState } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { db, storage, now } from "../../services/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../state/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function PortfolioScreen({ navigation, route }) {
  const { user, profile, loading: authLoading } = useAuth();
  const editItem = route.params?.editItem || null;

  const [desc, setDesc] = useState(editItem?.description || "");
  const [link, setLink] = useState(editItem?.link || "");
  const [image, setImage] = useState(editItem?.image || null);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editItem;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `portfolio/${user.uid}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const submitPortfolio = async () => {
    if (authLoading) {
      Alert.alert("⏳ Please wait, loading profile...");
      return;
    }
    if (!profile) {
      Alert.alert("⚠️ Profile not loaded yet.");
      return;
    }
    if (!desc.trim() && !image) {
      Alert.alert("⚠️ Error", "Please add a description or image.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = image;

      if (image && image.startsWith("file")) {
        imageUrl = await uploadImageAsync(image);
      }

      const payload = {
        description: desc,
        link: link || null,
        image: imageUrl,
        updatedAt: now(),
      };

      if (isEditing) {
        await updateDoc(
          doc(db, "users", user.uid, "portfolio", editItem.id),
          payload
        );
        Alert.alert("✅ Success", "Portfolio updated!");
      } else {
        payload.createdAt = now();
        await addDoc(collection(db, "users", user.uid, "portfolio"), payload);
        Alert.alert("✅ Success", "Portfolio added!");
      }

      navigation.goBack();
    } catch (error) {
      console.error("❌ Error saving portfolio:", error);
      Alert.alert("❌ Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff6a3d" />
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons  name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Edit Portfolio" : "Add Portfolio"}
          </Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ padding: 16 }}>
        <RNTextInput
          style={styles.input}
          placeholder="Description"
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        <RNTextInput
          style={styles.input}
          placeholder="Link (optional)"
          value={link}
          onChangeText={setLink}
        />

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <Text style={{ color: "#999" }}>+ Pick an image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={submitPortfolio}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Portfolio"
              : "Add Portfolio"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  imagePicker: {
    height: 150,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  preview: { width: "100%", height: "100%", borderRadius: 8 },
  submitBtn: {
    backgroundColor: "#ff6a3d",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
