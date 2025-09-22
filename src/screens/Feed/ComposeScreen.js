// ComposeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db, storage, now } from "../../services/firebase";
import { addDoc, collection, serverTimestamp as timestamp, updateDoc, increment, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../state/AuthContext";

export default function ComposeScreen({ navigation }) {
  const { user, profile, loading: authLoading } = useAuth();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [hashtags, setHashtags] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [visibility, setVisibility] = useState("public"); // public | private | friends
  const [loading, setLoading] = useState(false);

  // Pick Image
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

  // Upload Image
  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `posts/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // Submit Post
  const submitPost = async () => {
    if (authLoading) {
      Alert.alert("⏳ Please wait, loading profile...");
      return;
    }
    if (!profile) {
      Alert.alert("⚠️ Profile not loaded yet.");
      return;
    }

    if (!text.trim() && !image) {
      Alert.alert("⚠️ Error", "Please write something or add an image.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageAsync(image);
      }
      const payload = {
        text,
        image: imageUrl,
        hashtags: hashtags
          ? hashtags.split(",").map((t) => t.trim())
          : [],
        visibility,
        createdAt: now(),
        updatedAt: now(),
        author: {
          id: user?.uid || "guest",
          displayName: profile.displayName?.trim() || (user?.email?.split("@")[0] ?? "User"),
          photoURL: profile.photoURL || user?.photoURL || null,
        },
        likes: 0,
        saves: 0,
        comments: 0,
      };


      // Save post in main "posts" collection
      const postRef = await addDoc(collection(db, "posts"), payload);

      // Save to collection if name provided
      if (collectionName) {
        const q = query(
          collection(db, "collections"),
          where("title", "==", collectionName)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const collectionRef = snap.docs[0].ref;

          await addDoc(
            collection(db, "collections", collectionRef.id, "items"),
            {
              ...payload,
              postId: postRef.id,
            }
          );

          await updateDoc(collectionRef, {
            "stats.items": increment(1),
            updatedAt: now(),
          });

          Alert.alert(
            "✅ Success",
            `Your post was added to the "${collectionName}" collection.`
          );
        } else {
          Alert.alert(
            "⚠️ Collection not found",
            "The collection name you entered does not exist."
          );
        }
      } else {
        Alert.alert("✅ Success", "Your post has been published!");
      }

      // Reset form
      setText("");
      setImage(null);
      setHashtags("");
      setCollectionName("");
      setVisibility("public");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error posting:", error);
      Alert.alert("❌ Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Show loader until profile is ready
  if (authLoading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>✍️ Create a Post</Text>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>📸 Pick an Image</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TextInput
        style={styles.input}
        placeholder="Add hashtags (comma separated)"
        value={hashtags}
        onChangeText={setHashtags}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter collection name (optional)"
        value={collectionName}
        onChangeText={setCollectionName}
      />

      <View style={styles.visibilityRow}>
        {["public", "friends", "private"].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.visibilityButton,
              visibility === opt && styles.activeVisibility,
            ]}
            onPress={() => setVisibility(opt)}
          >
            <Text
              style={[
                styles.visibilityText,
                visibility === opt && styles.activeVisibilityText,
              ]}
            >
              {opt.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.postButton}
        onPress={submitPost}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postButtonText}>🚀 Post</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8f9fa", flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  imageButton: {
    backgroundColor: "#6c63ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  imageButtonText: { color: "#fff", fontWeight: "bold" },
  image: { width: "100%", height: 200, borderRadius: 10, marginBottom: 12 },
  visibilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  visibilityButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#6c63ff",
    borderRadius: 8,
    alignItems: "center",
  },
  activeVisibility: { backgroundColor: "#6c63ff" },
  visibilityText: { color: "#6c63ff", fontWeight: "bold" },
  activeVisibilityText: { color: "#fff" },
  postButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
