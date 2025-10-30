// src/screens/ComposeScreen.js
import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons"; // icons
import { db, storage, now } from "../../services/firebase";
import {
  addDoc,
  collection,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../state/AuthContext";
import { trackHashtags } from "../../services/hashtags";

export default function ComposeScreen({ navigation }) {
  const { user, profile, loading: authLoading } = useAuth();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [hashtags, setHashtags] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  // collections state
  const [allCollections, setAllCollections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);

  // fetch collections
  useEffect(() => {
    if (!user?.uid) return;
    const loadCollections = async () => {
      const snap = await getDocs(
        query(collection(db, "collections"), where("ownerId", "==", user.uid))
      );
      setAllCollections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadCollections();
  }, [user]);

  // filter collections
  useEffect(() => {
    if (!collectionName.trim()) {
      setFiltered([]);
      return;
    }
    const q = collectionName.toLowerCase();
    const results = allCollections.filter((c) =>
      c.title?.toLowerCase().includes(q)
    );
    setFiltered(results);
  }, [collectionName, allCollections]);

  // quick create
  const quickCreateCollection = async (name) => {
    try {
      const payload = {
        ownerId: user.uid,
        title: name.trim().toLowerCase(),
        description: "",
        visibility: "private",
        cover: {},
        stats: { items: 0, saves: 0, shares: 0, views: 0 },
        createdAt: now(),
        updatedAt: now(),
      };
      const docRef = await addDoc(collection(db, "collections"), payload);
      const newCollection = { id: docRef.id, ...payload };
      setAllCollections((prev) => [newCollection, ...prev]);
      setSelectedCollection(newCollection);
      setCollectionName(newCollection.title);
      setFiltered([]);
      Alert.alert("✅ Created", `New collection "${name}" created`);
    } catch (err) {
      console.error("quickCreate error:", err);
      Alert.alert("❌ Error", "Failed to create collection");
    }
  };

  // pick image
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

  // upload image
  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `posts/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // submit post
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

      // extract hashtags
      const extractedTags = Array.from(
        new Set(
          [
            ...text.matchAll(/#(\w+)/g),
            ...(hashtags
              ? hashtags.split(",").map((t) => [t.trim().replace("#", "")])
              : []),
          ]
            .map((m) => (m[1] || m[0]).toLowerCase().trim())
            .filter((tag) => tag.length > 0)
        )
      );

      const payload = {
        text,
        image: imageUrl,
        hashtags: extractedTags,
        visibility,
        createdAt: now(),
        updatedAt: now(),
        author: {
          id: user?.uid || "guest",
          displayName:
            profile.displayName?.trim() ||
            (user?.email?.split("@")[0] ?? "User"),
          photoURL: profile.photoURL || user?.photoURL || null,
        },
        authorId: user?.uid || "guest",
        likes: 0,
        saves: 0,
        comments: 0,
      };

      const postRef = await addDoc(collection(db, "posts"), payload);

      if (extractedTags.length) {
        await trackHashtags(extractedTags);

        for (const tag of extractedTags) {
          const tagRef = doc(db, "hashtags", tag.toLowerCase());
          await setDoc(
            tagRef,
            {
              posts: {
                [visibility]: arrayUnion(postRef.id),
              },
              updatedAt: now(),
            },
            { merge: true }
          );
        }
      }

      // add to collection if given
      if (collectionName) {
        let targetCollection = selectedCollection;

        if (!targetCollection) {
          const q = query(
            collection(db, "collections"),
            where("title", "==", collectionName.trim().toLowerCase())
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            targetCollection = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }

        if (targetCollection) {
          const collectionRef = doc(db, "collections", targetCollection.id);
          await addDoc(
            collection(db, "collections", targetCollection.id, "items"),
            { ...payload, postId: postRef.id }
          );
          await updateDoc(collectionRef, {
            "stats.items": increment(1),
            updatedAt: now(),
          });
          Alert.alert("✅ Success", `Added to "${targetCollection.title}"`);
        } else {
          Alert.alert("⚠️ Collection not found");
        }
      } else {
        Alert.alert("✅ Success", "Your post has been published!");
      }

      // reset form
      setText("");
      setImage(null);
      setHashtags("");
      setCollectionName("");
      setSelectedCollection(null);
      setVisibility("public");
      navigation.goBack();
    } catch (error) {
      console.error("post error:", error);
      Alert.alert("❌ Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.card}>
          <RNTextInput
            style={[styles.input, { height: 100 }]}
            placeholder="What's on your mind?"
            value={text}
            onChangeText={setText}
            multiline
          />

          <TouchableOpacity style={styles.coverBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.coverImage} />
            ) : (
              <Ionicons name="image-outline" size={32} color="#888" />
            )}
          </TouchableOpacity>

          <RNTextInput
            style={styles.input}
            placeholder="# Add hashtags (comma separated)"
            value={hashtags}
            onChangeText={setHashtags}
          />

          {/* collections input */}
          <RNTextInput
            style={styles.input}
            placeholder="Enter collection name (optional)"
            value={collectionName}
            onChangeText={(text) => {
              setCollectionName(text);
              setSelectedCollection(null);
            }}
          />

          {/* dropdown */}
          {collectionName.length > 0 && !selectedCollection && (
            <View style={styles.dropdown}>
              {[
                ...filtered,
                !filtered.some(
                  (c) =>
                    c.title.toLowerCase() ===
                    collectionName.trim().toLowerCase()
                ) && {
                  id: "new",
                  title: `➕ Create "${collectionName}"`,
                  isNew: true,
                },
              ]
                .filter(Boolean)
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      if (item.isNew) {
                        quickCreateCollection(collectionName);
                      } else {
                        setSelectedCollection(item);
                        setCollectionName(item.title);
                        setFiltered([]);
                      }
                    }}
                  >
                    <Text>{item.title}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* visibility toggle */}
          <View style={styles.visibilityRow}>
            {["public", "friends", "private"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.visibilityBtn,
                  visibility === opt && styles.selectedVisibility,
                ]}
                onPress={() => setVisibility(opt)}
              >
                <Text
                  style={{
                    color: visibility === opt ? "#fff" : "#333",
                    fontWeight: "600",
                  }}
                >
                  {opt.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.postButton}
            onPress={submitPost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Publish Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  backBtn: { position: "absolute", left: 16, top: 30 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff", paddingTop: 8 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#f7f7f7",
  },
  coverBox: {
    width: "100%",
    height: 180,
    backgroundColor: "#eee",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  coverImage: { width: "100%", height: "100%", borderRadius: 12 },
  visibilityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  visibilityBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#888",
  },
  selectedVisibility: { backgroundColor: "#ff6a3d" },
  saveButtonContainer: { marginTop: 20, paddingHorizontal: 16 },
  postButton: {
    backgroundColor: "#ff6a3d",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  postButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 150,
    marginBottom: 12,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
