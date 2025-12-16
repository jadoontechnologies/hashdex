// ComposeScreen.js - Fully Fixed Version
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { db, now } from "../../services/firebase";
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
import { useAuth } from "../../state/AuthContext";
import { trackHashtags } from "../../services/hashtags";
import MediaCarousel from "../../components/MediaCarousel";
import Header from "../../components/Header";
import { improveWithGrok } from "../../services/ai";
import { uploadToCloudinary } from "../../services/cloudinary";
import { startRecording, stopRecordingAndTranscribe } from "../../services/VoiceService";

export default function ComposeScreen({ navigation, route }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [text, setText] = useState("");
  const [mediaList, setMediaList] = useState([]);
  const [hashtags, setHashtags] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [allCollections, setAllCollections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const isMounted = useRef(true);

  // --- Handle shared content ---
  useEffect(() => {
    if (route.params?.sharedText) setText(route.params.sharedText);
    if (route.params?.sharedImage)
      setMediaList([{ uri: route.params.sharedImage, type: "image" }]);
    if (route.params?.sharedVideo)
      setMediaList([{ uri: route.params.sharedVideo, type: "video" }]);
    if (route.params?.sharedFile)
      setMediaList([{
        uri: route.params.sharedFile,
        type: "pdf",
        name: route.params.sharedFileName,
      }]);
  }, [route.params]);

  // --- Fetch user collections ---
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "collections"), where("ownerId", "==", user.uid))
        );
        if (active)
          setAllCollections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading collections:", err);
      }
    })();
    return () => { active = false; };
  }, [user]);

  // --- Filter collections ---
  useEffect(() => {
    if (!collectionName.trim()) return setFiltered([]);
    const q = collectionName.toLowerCase();
    setFiltered(allCollections.filter((c) => c.title?.toLowerCase().includes(q)));
  }, [collectionName, allCollections]);

  useEffect(() => () => { isMounted.current = false; }, []);

  // --- Pick images/videos ---
  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please allow media access.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const picked = result.assets.map((a) => ({
          uri: a.uri,
          type: a.type === "video" ? "video" : "image",
        }));
        setMediaList((prev) => [...prev, ...picked]);
      }
    } catch (err) {
      console.error("Picker error:", err);
    }
  };

  // --- Pick PDF ---
  // --- Pick PDF --- (SIMPLER VERSION)
  const pickPDF = async () => {
    try {
      // Simple picker without platform checks
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      console.log("PDF picker result:", result);

      // Check for new API (assets array)
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaList((prev) => [
          ...prev,
          {
            uri: asset.uri,
            type: "pdf",
            name: asset.name || "document.pdf",
            size: asset.size || 0
          },
        ]);
        Alert.alert("Success", "PDF added successfully!");
      }
      // Check for old API (uri directly)
      else if (result.uri) {
        setMediaList((prev) => [
          ...prev,
          {
            uri: result.uri,
            type: "pdf",
            name: result.name || "document.pdf",
            size: result.size || 0
          },
        ]);
        Alert.alert("Success", "PDF added successfully!");
      }
      // User cancelled
      else if (result.canceled) {
        console.log("User cancelled PDF selection");
      }
    } catch (err) {
      console.error("PDF picker error:", err);
      Alert.alert("Error", `Failed to pick PDF: ${err.message || "Please try again"}`);
    }
  };

  // --- Remove media item ---
  const removeMediaItem = (index) => setMediaList(prev => prev.filter((_, i) => i !== index));

  // --- Quick create collection ---
  const quickCreateCollection = async (name) => {
    if (!name.trim()) return;
    try {
      const lower = name.trim().toLowerCase();
      if (allCollections.some((c) => c.title.toLowerCase() === lower)) {
        Alert.alert("Already Exists", "Collection already exists.");
        return;
      }
      const payload = {
        ownerId: user.uid,
        title: lower,
        description: "",
        visibility: "private",
        cover: {},
        stats: { items: 0, saves: 0, shares: 0, views: 0 },
        createdAt: now(),
        updatedAt: now(),
      };
      const ref = await addDoc(collection(db, "collections"), payload);
      const newCol = { id: ref.id, ...payload };
      setAllCollections((p) => [newCol, ...p]);
      setSelectedCollection(newCol);
      setCollectionName(newCol.title);
      setFiltered([]);
      Alert.alert("Created", `Collection "${name}" added.`);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to create collection.");
    }
  };

  // ======= Mic toggle =======
  const handleMicToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);
      const originalText = text;
      setText(prev => (prev ? prev + " Loading..." : "Loading..."));
      try {
        const res = await stopRecordingAndTranscribe();
        if (res?.text) {
          setText(originalText ? originalText + " " + res.text : res.text);
        } else {
          setText(originalText);
          Alert.alert("Voice", "No transcription result.");
        }
      } catch (err) {
        console.error("Transcription failed:", err);
        setText(originalText);
        Alert.alert("Voice Error", err.message || "Failed to transcribe");
      } finally {
        setIsTranscribing(false);
      }
    } else {
      try {
        await startRecording();
        setIsRecording(true);
      } catch (err) {
        console.error("Start recording failed:", err);
        Alert.alert("Voice Error", err.message.includes("permission") ? "Microphone permission is required." : err.message || "Failed to start recording");
      }
    }
  };

  const extractHashtags = (input) => {
    const matches = input.match(/#\w+/g) || [];
    setHashtags(matches.join(", "));
  };

  const onAIPress = async () => {
    if (!text.trim()) {
      Alert.alert("Warning", "Please enter some text first");
      return;
    }
    setLoading(true);
    try {
      const response = await improveWithGrok(text);
      if (response?.suggestions?.length > 0) {
        setAiSummary(response.summary || "Suggestions:");
        setAiSuggestions(response.suggestions);
        extractHashtags(response.suggestions.join(" "));
        setShowModal(true);
      } else {
        Alert.alert("AI Response", "No suggestions returned.");
      }
    } catch (err) {
      console.error("AI Error:", err);
      Alert.alert("AI Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = (s) => { setText(s); setShowModal(false); };

  // --- Submit post ---
  // --- Submit post ---
  const submitPost = async () => {
    if (authLoading || !profile) {
      Alert.alert("Wait", "Profile still loading.");
      return;
    }
    if (!text.trim() && mediaList.length === 0) {
      Alert.alert("Error", "Write something or add media.");
      return;
    }
    setLoading(true);
    try {
      // Upload media files
      const uploads = await Promise.allSettled(
        mediaList.map(async (m) => {
          if (m.size && m.size > 50 * 1024 * 1024) {
            Alert.alert("Large File", `${m.name} is too big (max 50MB).`);
            return null;
          }

          const url = await uploadToCloudinary(m.uri, m.type, m.name);

          return url
            ? {
              type: m.type,
              url,
              name: m.name || (m.type === "pdf" ? "document.pdf" : "file"),
            }
            : null;
        })
      );

      const uploaded = uploads
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => r.value);

      // Extract hashtags
      const tagMatches = Array.from(text.matchAll(/#(\w+)/g)).map(m => m[1]);
      const extra = hashtags?.split(",")
        .map(t => t.trim().replace("#", ""))
        .filter(t => t.length > 0);

      const extractedTags = Array.from(
        new Set([...tagMatches, ...extra].filter(Boolean).map(t => t.toLowerCase()))
      );

      // Create author object with safe defaults
      const author = {
        id: user.uid,
        displayName: profile.displayName || user.displayName || user.email?.split("@")[0] || "Anonymous",
        photoURL: profile.photoURL || user.photoURL || "",
        email: user.email || "",
      };

      // Remove any undefined/null values from author object
      Object.keys(author).forEach(key => {
        if (author[key] === undefined || author[key] === null) {
          author[key] = "";
        }
      });

      const payload = {
        text: text.trim(),
        media: uploaded.length > 0 ? uploaded : [],
        hashtags: extractedTags,
        visibility,
        createdAt: now(),
        updatedAt: now(),
        authorId: user.uid,
        author: author, // Use the cleaned author object
        likes: 0,
        saves: 0,
        comments: 0,
        shares: 0,
        views: 0,
      };

      // Remove any undefined values from the entire payload
      const cleanPayload = JSON.parse(JSON.stringify(payload));

      console.log("Submitting post with payload:", cleanPayload);

      const postRef = await addDoc(collection(db, "posts"), cleanPayload);

      if (extractedTags.length) {
        await trackHashtags(extractedTags);
        for (const tag of extractedTags) {
          const tagRef = doc(db, "hashtags", tag.toLowerCase());
          await setDoc(tagRef, {
            posts: { [visibility]: arrayUnion(postRef.id) },
            updatedAt: now(),
            count: increment(1)
          }, { merge: true });
        }
      }

      if (collectionName) {
        let target = selectedCollection;
        if (!target) {
          const snap = await getDocs(query(
            collection(db, "collections"),
            where("title", "==", collectionName.trim().toLowerCase())
          ));
          if (!snap.empty) target = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
        if (target) {
          await addDoc(
            collection(db, "collections", target.id, "items"),
            { ...cleanPayload, postId: postRef.id }
          );
          await updateDoc(
            doc(db, "collections", target.id),
            {
              "stats.items": increment(1),
              updatedAt: now()
            }
          );
        }
      }

      Alert.alert(
        "Success",
        "Post published!",
        [{
          text: "OK",
          onPress: () => {
            // Clear form only after successful submission
            if (isMounted.current) {
              setText("");
              setMediaList([]);
              setHashtags("");
              setCollectionName("");
              setSelectedCollection(null);
              setVisibility("public");
            }
            navigation.goBack();
          }
        }]
      );
    } catch (err) {
      console.error("Submit post error:", err);
      Alert.alert(
        "Error",
        err.message || "Something went wrong while publishing your post"
      );
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a3d" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Header title="Create Post" showBackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.card}>
          <RNTextInput
            style={[styles.input, { height: 100 }]}
            placeholder="What's on your mind?"
            value={text}
            onChangeText={setText}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleMicToggle}
              style={[styles.micButton, isRecording && styles.micRecording]}
              activeOpacity={0.8}
              disabled={isTranscribing}
            >
              {isTranscribing ? <ActivityIndicator color="#fff" /> :
                <Image source={require("../../../assets/icons/mic.png")} style={styles.icon} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={onAIPress} style={{ flex: 1 }}>
              <LinearGradient
                colors={["#F9F871", "#F28A47", "#DE5C76"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiButton}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Image source={require("../../../assets/icons/ai.png")} style={styles.icon} />
                    <Text style={styles.aiText}>Improve with AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {mediaList.length > 0 ? (
            <MediaCarousel media={mediaList} fullScreen={false} removeMediaItem={removeMediaItem} />
          ) : (
            <TouchableOpacity style={styles.coverBox} onPress={pickMedia}>
              <Text style={{ color: "#999" }}>Tap to add media</Text>
            </TouchableOpacity>
          )}

          <View style={styles.mediaButtonsRow}>
            <TouchableOpacity onPress={pickMedia} style={styles.mediaButton}>
              <Image source={require("../../../assets/icons/image.png")} style={styles.smallIcon} />
              <Text style={styles.addMore}>Images/Videos</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickPDF} style={styles.mediaButton}>
              <Image source={require("../../../assets/icons/pdf.png")} style={styles.smallIcon} />
              <Text style={styles.addMore}>Add PDF</Text>
            </TouchableOpacity>
          </View>

          <RNTextInput
            style={styles.input}
            placeholder="Enter collection name (optional)"
            value={collectionName}
            onChangeText={(t) => { setCollectionName(t); setSelectedCollection(null); }}
          />

          {collectionName.length > 0 && !selectedCollection && (
            <View style={styles.dropdown}>
              {[...filtered,
              !filtered.some((c) => c.title.toLowerCase() === collectionName.trim().toLowerCase()) && {
                id: "new",
                title: `➕ Create "${collectionName}"`,
                isNew: true,
              }].filter(Boolean).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (item.isNew) quickCreateCollection(collectionName);
                    else { setSelectedCollection(item); setCollectionName(item.title); setFiltered([]); }
                  }}
                >
                  <Text>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.visibilityRow}>
            {["public", "friends", "private"].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.visibilityBtn, visibility === opt && styles.selectedVisibility]}
                onPress={() => setVisibility(opt)}
              >
                <Text style={{ color: visibility === opt ? "#fff" : "#333", fontWeight: "600" }}>{opt.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.postButton} onPress={submitPost} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Publish Post</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ margin: 20, backgroundColor: "#fff", padding: 20, borderRadius: 12 }}>
            <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
              {aiSuggestions.map((s, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ flex: 1 }}>{s}</Text>
                  <TouchableOpacity
                    onPress={() => acceptSuggestion(s)}
                    style={{ padding: 8, backgroundColor: "#4caf50", borderRadius: 8, marginLeft: 8 }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{ padding: 12, backgroundColor: "#f44336", borderRadius: 8 }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", padding: 16, margin: 16, borderRadius: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16, backgroundColor: "#f7f7f7" },
  coverBox: { width: "100%", height: 220, backgroundColor: "#eee", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  mediaButtonsRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 8 },
  mediaButton: { alignItems: "center", padding: 8 },
  addMore: { textAlign: "center", color: "#ff6a3d", fontWeight: "600", fontSize: 12, marginTop: 4 },
  buttonRow: { flexDirection: "row", marginVertical: 12, alignItems: "center" },
  micButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#eee", justifyContent: "center", alignItems: "center", marginRight: 12 },
  micRecording: { backgroundColor: "#ff6a3d" },
  aiButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 25 },
  icon: { width: 24, height: 24, marginRight: 8 },
  smallIcon: { width: 20, height: 20 },
  aiText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  visibilityRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  visibilityBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "#888" },
  selectedVisibility: { backgroundColor: "#ff6a3d" },
  saveButtonContainer: { marginTop: 20, paddingHorizontal: 16 },
  postButton: { backgroundColor: "#ff6a3d", padding: 14, borderRadius: 8, alignItems: "center" },
  postButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  dropdown: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, maxHeight: 150, marginBottom: 12 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  pdfInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 8 },
  pdfName: { flex: 1, marginLeft: 8, color: "#333", fontSize: 14 },
  removeButton: { padding: 4, marginLeft: 8 },
  removeText: { color: "#ff4444", fontSize: 18, fontWeight: "bold" },
});
