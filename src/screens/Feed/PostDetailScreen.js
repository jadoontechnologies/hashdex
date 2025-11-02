// src/screens/PostDetailScreen.js
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { db } from "../../services/firebase";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { AuthContext } from "../../state/AuthContext";
import { addComment, toggleLike, toggleSave } from "../../services/interactions";
import { updateHashtagCounts } from "../../services/hashtags";
import { Picker } from "@react-native-picker/picker";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import Header from "../../components/Header";
import MediaCarousel from "../../components/MediaCarousel"; // ✅ show videos/images
import { Provider, Menu } from "react-native-paper";

function getRelativeTime(date) {
  if (!date) return "";
  if (typeof date.toDate === "function") date = date.toDate();
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

export default function PostDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useContext(AuthContext);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [menuVisible, setMenuVisible] = useState(false);

  // Subscribe to post & comments
  useEffect(() => {
    const postRef = doc(db, "posts", id);
    const unsubPost = onSnapshot(postRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPost({ id, ...data });
        setLiked(data.likedBy?.includes(user.uid) || false);
        setSaved(data.savedBy?.includes(user.uid) || false);
        setVisibility(data.visibility || "public");
      }
    });

    const unsubComments = onSnapshot(
      query(collection(db, "posts", id, "comments"), orderBy("createdAt", "asc")),
      (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubPost();
      unsubComments();
    };
  }, [id]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(id, user, newComment.trim());
      setNewComment("");
    } catch (err) {
      console.error("Comment error:", err);
      Alert.alert("Error", "Failed to send comment");
    }
  };

  const handleLike = async () => {
    try {
      setLiked((prev) => !prev);
      await toggleLike(id, user, liked);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to toggle like");
    }
  };

  const handleSave = async () => {
    try {
      setSaved((prev) => !prev);
      await toggleSave(id, user, saved);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to toggle save");
    }
  };

  const handleDelete = async () => {
    setMenuVisible(false);
    Alert.alert("Delete Post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (post?.hashtags) {
              await updateHashtagCounts(post.hashtags, post.visibility || "public", null);
            }
            await deleteDoc(doc(db, "posts", id));
            navigation.goBack();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    const oldVis = post.visibility || "public";
    const newVis = visibility;

    const extractedTags = Array.from(
      new Set([...editText.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase()))
    );

    const updatedPayload = {
      text: editText.trim(),
      hashtags: extractedTags,
      visibility: newVis,
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, "posts", id), updatedPayload);

      if (post.hashtags?.length || extractedTags.length) {
        await updateHashtagCounts(post.hashtags || [], oldVis, null);
        await updateHashtagCounts(extractedTags, null, newVis);
      }

      // Update in collections if necessary
      const collectionsSnap = await getDocs(collection(db, "collections"));
      for (const colSnap of collectionsSnap.docs) {
        const itemsRef = collection(db, "collections", colSnap.id, "items");
        const itemQ = query(itemsRef, where("postId", "==", id));
        const itemSnap = await getDocs(itemQ);
        itemSnap.forEach(async (itemDoc) => {
          await updateDoc(itemDoc.ref, updatedPayload);
        });
      }

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save edits");
    }
  };

  if (!post) return <Text style={{ padding: 20 }}>Loading...</Text>;

  const createdAt = post.createdAt?.toDate?.() ?? null;
  const relativeTime = createdAt ? getRelativeTime(createdAt) : "";

  return (
    <Provider>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <Header
          title={isEditing ? "Edit Post" : "Post Detail"}
          leftIcon="arrow-back"
          onLeftPress={() => (isEditing ? setIsEditing(false) : navigation.goBack())}
          rightIcon="ellipsis-vertical"
          onRightPress={() => setMenuVisible(true)}
        />

        {/* Menu */}
        <Menu visible={menuVisible} onDismiss={() => setMenuVisible(false)} anchor={{ x: 400, y: 75 }}>
          {post.author?.id === user.uid && (
            <>
              <Menu.Item
                onPress={() => {
                  setEditText(post.text);
                  setIsEditing(true);
                  setMenuVisible(false);
                }}
                title="Edit Post"
                leadingIcon={() => <Feather name="edit-2" size={18} />}
              />
              <Menu.Item
                onPress={handleDelete}
                title="Delete Post"
                leadingIcon={() => <MaterialIcons name="delete-outline" size={20} />}
              />
            </>
          )}
          <Menu.Item onPress={() => setMenuVisible(false)} title="Cancel" />
        </Menu>

        {/* Post + Comments */}
        <FlatList
          style={styles.wrap}
          data={isEditing ? [] : comments}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cmtAuthor}>{item.author?.displayName || "User"}</Text>
                <Text style={styles.cmtTime}>
                  {item.createdAt ? getRelativeTime(item.createdAt.toDate()) : ""}
                </Text>
              </View>
              <Text style={styles.cmtText}>{item.text}</Text>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.postCard}>
              <View style={styles.profileRow}>
                <Image
                  source={{ uri: post.author?.photoURL || "https://placekitten.com/80/80" }}
                  style={styles.profilePic}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.author}>{post.author?.displayName || "User"}</Text>
                  <Text style={styles.timestamp}>{relativeTime}</Text>
                </View>
              </View>
              <Text style={styles.privacyLabel}>
                Privacy: {post.visibility || "public"}
              </Text>

              {isEditing ? (
                <View style={styles.editBox}>
                  <TextInput
                    style={styles.input}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                  />
                  <View style={styles.dropdown}>
                    <Picker selectedValue={visibility} onValueChange={setVisibility}>
                      <Picker.Item label="Public" value="public" />
                      <Picker.Item label="Friends" value="friends" />
                      <Picker.Item label="Private" value="private" />
                    </Picker>
                  </View>
                  <View style={styles.row}>
                    <TouchableOpacity onPress={handleSaveEdit} style={styles.btn}>
                      <Text style={{ color: "#fff" }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsEditing(false)}
                      style={[styles.btn, { backgroundColor: "#aaa" }]}
                    >
                      <Text style={{ color: "#fff" }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.text}>{post.text}</Text>
                  {/* ✅ Render multiple images/videos */}
                  {Array.isArray(post.media) && post.media.length > 0 && (
                    <MediaCarousel media={post.media} />
                  )}
                </>
              )}

              {!isEditing && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={handleLike}>
                    <Text>{liked ? "❤️ Unlike" : "🤍 Like"} ({post.stats?.likes || 0})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text>💬 Comment ({post.stats?.comments || 0})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave}>
                    <Text>{saved ? "🔖 Saved" : "🔖 Save"} ({post.stats?.saves || 0})</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            !isEditing && (
              <View style={styles.commentSection}>
                <View style={styles.commentBox}>
                  <TextInput
                    placeholder="Write a comment..."
                    style={{ flex: 1, paddingHorizontal: 8 }}
                    value={newComment}
                    onChangeText={setNewComment}
                  />
                  <TouchableOpacity onPress={handleSendComment}>
                    <Text style={{ color: "#ff6a3d", fontWeight: "700" }}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }
        />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 12 },
  postCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 16 },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ddd" },
  author: { fontWeight: "700", fontSize: 16 },
  timestamp: { fontSize: 12, color: "#777" },
  text: { marginBottom: 8, fontSize: 15 },
  actions: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8 },
  editBox: { backgroundColor: "#f9f9f9", padding: 8, borderRadius: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 6, minHeight: 60 },
  row: { flexDirection: "row", justifyContent: "space-around", marginTop: 8 },
  btn: { backgroundColor: "#ff6a3d", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  dropdown: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginVertical: 8 },
  commentSection: { backgroundColor: "#fff", borderRadius: 10, padding: 8 },
  commentBox: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderColor: "#eee", padding: 8 },
  commentCard: { backgroundColor: "#f8f8f8", borderRadius: 8, padding: 8, marginVertical: 4 },
  cmtAuthor: { fontWeight: "600", marginBottom: 2 },
  cmtText: { fontSize: 14 },
  cmtTime: { fontSize: 11, color: "#888" },
  privacyLabel: { fontSize: 12, color: "#555", marginTop: 2 },
});
