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
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../state/AuthContext";
import { addComment, toggleLike, toggleSave } from "../../services/interactions";
import { updateHashtagCounts } from "../../services/hashtags";
import { Picker } from "@react-native-picker/picker";

import Header from "../../components/Header";
import MediaCarousel from "../../components/MediaCarousel";
import { Provider, Menu } from "react-native-paper";
import { VideoView, useVideoPlayer } from "expo-video";

// Manual PNG icons
import MoreDots from "../../../assets/icons/more-dots.png";
import EditIcon from "../../../assets/icons/edit.png";
import TrashIcon from "../../../assets/icons/trash.png";

// Relative time helper
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

// Media preview in edit mode
const MediaPreview = ({ media, onRemove }) => {
  if (media.type === "video") {
    const player = useVideoPlayer(media.url || media.uri, (player) => player.pause());

    return (
      <View style={styles.mediaItem}>
        <VideoView style={styles.mediaThumb} player={player} contentFit="cover" />
        <TouchableOpacity style={styles.removeIcon} onPress={onRemove}>
          <Text style={{ color: "#fff", fontSize: 14 }}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mediaItem}>
      <Image source={{ uri: media.url || media.uri }} style={styles.mediaThumb} />
      <TouchableOpacity style={styles.removeIcon} onPress={onRemove}>
        <Text style={{ color: "#fff", fontSize: 14 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  const [editMedia, setEditMedia] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [menuVisible, setMenuVisible] = useState(false);

  // Subscribe to post and comments
  useEffect(() => {
    const postRef = doc(db, "posts", id);

    const unsubPost = onSnapshot(postRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPost({ id, ...data });
        setEditMedia(data.media || []);
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

  // Add comment
  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(id, user, newComment.trim());
      setNewComment("");
    } catch {
      Alert.alert("Error", "Failed to send comment");
    }
  };

  // Like
  const handleLike = async () => {
    try {
      setLiked(!liked);
      await toggleLike(id, user, liked);
    } catch {
      Alert.alert("Error", "Failed to toggle like");
    }
  };

  // Save
  const handleSave = async () => {
    try {
      setSaved(!saved);
      await toggleSave(id, user, saved);
    } catch {
      Alert.alert("Error", "Failed to toggle save");
    }
  };

  // Delete
  const handleDelete = async () => {
    setMenuVisible(false);

    Alert.alert("Delete Post?", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (post?.hashtags)
              await updateHashtagCounts(post.hashtags, post.visibility, null);

            await deleteDoc(doc(db, "posts", id));
            navigation.goBack();
          } catch {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  // Pick photos
  const handleAddMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newItems = result.assets.map((a) => ({
          uri: a.uri,
          type: a.type || "image",
        }));

        setEditMedia((prev) => [...prev, ...newItems]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick media");
    }
  };

  // Save edits
  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    const oldVis = post.visibility;
    const newVis = visibility;

    const tags = Array.from(
      new Set([...editText.matchAll(/#(\w+)/g)].map((m) => m[1].toLowerCase()))
    );

    const payload = {
      text: editText.trim(),
      hashtags: tags,
      visibility: newVis,
      media: editMedia,
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, "posts", id), payload);

      // Update hashtags
      await updateHashtagCounts(post.hashtags || [], oldVis, null);
      await updateHashtagCounts(tags, null, newVis);

      // Update in collections
      const collectionsSnap = await getDocs(collection(db, "collections"));

      for (const col of collectionsSnap.docs) {
        const itemsRef = collection(db, "collections", col.id, "items");
        const q = query(itemsRef, where("postId", "==", id));
        const snap = await getDocs(q);

        snap.forEach(async (item) => {
          await updateDoc(item.ref, payload);
        });
      }

      setIsEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save edit");
    }
  };

  if (!post) return <Text style={{ padding: 20 }}>Loading...</Text>;

  const createdAt = post.createdAt?.toDate?.() ?? null;
  const relativeTime = createdAt ? getRelativeTime(createdAt) : "";

  return (
    <Provider>
      <View style={{ flex: 1 }}>
        {/* Header with PNG icons */}
        <Header
          title={isEditing ? "Edit Post" : "Post Detail"}
          showBackButton
          onLeftPress={() => (isEditing ? setIsEditing(false) : navigation.goBack())}
          rightIconComponent={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Image source={MoreDots} style={{ width: 22, height: 22 }} />
            </TouchableOpacity>
          }
        />

        {/* Popup Menu */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 350, y: 70 }}
        >
          {post.author?.id === user.uid && (
            <>
              <Menu.Item
                onPress={() => {
                  setEditText(post.text);
                  setIsEditing(true);
                  setMenuVisible(false);
                }}
                title="Edit Post"
                leadingIcon={() => (
                  <Image source={EditIcon} style={{ width: 18, height: 18 }} />
                )}
              />
              <Menu.Item
                onPress={handleDelete}
                title="Delete Post"
                titleStyle={{ color: "red", fontWeight: "600" }}
                leadingIcon={() => (
                  <Image
                    source={TrashIcon}
                    style={{ width: 18, height: 18 }}
                  />
                )}
              />

            </>
          )}

          <Menu.Item title="Cancel" onPress={() => setMenuVisible(false)} />
        </Menu>

        <FlatList
          style={styles.wrap}
          data={isEditing ? [] : comments}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.cmtAuthor}>
                  {item.author?.displayName || "User"}
                </Text>
                <Text style={styles.cmtTime}>
                  {item.createdAt ? getRelativeTime(item.createdAt.toDate()) : ""}
                </Text>
              </View>
              <Text style={styles.cmtText}>{item.text}</Text>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.postCard}>
              {/* Author Row */}
              <View style={styles.profileRow}>
                <Image
                  source={{
                    uri: post.author?.photoURL || "https://placekitten.com/80/80",
                  }}
                  style={styles.profilePic}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.author}>{post.author?.displayName}</Text>
                  <Text style={styles.timestamp}>{relativeTime}</Text>
                </View>
              </View>

              <Text style={styles.privacyLabel}>
                Privacy: {post.visibility || "public"}
              </Text>

              {/* EDIT MODE */}
              {isEditing ? (
                <View style={styles.editBox}>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    style={styles.input}
                  />

                  {editMedia.length > 0 && (
                    <View style={styles.mediaGrid}>
                      {editMedia.map((m, i) => (
                        <MediaPreview
                          key={i}
                          media={m}
                          onRemove={() =>
                            setEditMedia((prev) =>
                              prev.filter((_, index) => index !== i)
                            )
                          }
                        />
                      ))}
                    </View>
                  )}

                  <TouchableOpacity onPress={handleAddMedia} style={styles.btn}>
                    <Text style={{ color: "#fff" }}>Add Media</Text>
                  </TouchableOpacity>

                  <View style={styles.dropdown}>
                    <Picker selectedValue={visibility} onValueChange={setVisibility}>
                      <Picker.Item label="Public" value="public" />
                      <Picker.Item label="Friends" value="friends" />
                      <Picker.Item label="Private" value="private" />
                    </Picker>
                  </View>

                  <View style={styles.row}>
                    <TouchableOpacity style={styles.btn} onPress={handleSaveEdit}>
                      <Text style={{ color: "#fff" }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#999" }]}
                      onPress={() => setIsEditing(false)}
                    >
                      <Text style={{ color: "#fff" }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.text}>{post.text}</Text>

                  {post.media?.length > 0 && (
                    <MediaCarousel media={post.media} />
                  )}
                </>
              )}

              {/* ACTIONS */}
              {!isEditing && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={handleLike}>
                    <Text>
                      {liked ? "❤️ Unlike" : "🤍 Like"} ({post.stats?.likes || 0})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text>💬 Comment ({post.stats?.comments || 0})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleSave}>
                    <Text>
                      {saved ? "🔖 Saved" : "🔖 Save"} ({post.stats?.saves || 0})
                    </Text>
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
                    style={{ flex: 1 }}
                    value={newComment}
                    onChangeText={setNewComment}
                  />
                  <TouchableOpacity onPress={handleSendComment}>
                    <Text style={{ color: "#ff6a3d", fontWeight: "600" }}>Send</Text>
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
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  author: { fontWeight: "700", fontSize: 16 },
  timestamp: { fontSize: 12, color: "#777" },
  text: { marginTop: 8, marginBottom: 8, fontSize: 15 },
  privacyLabel: { fontSize: 12, color: "#555", marginBottom: 6 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    paddingVertical: 8,
  },
  editBox: { backgroundColor: "#f5f5f5", padding: 10, borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    minHeight: 70,
    backgroundColor: "#fff",
  },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  mediaItem: { position: "relative" },
  mediaThumb: {
    width: 100,
    height: 100,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  removeIcon: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  btn: {
    backgroundColor: "#ff6a3d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  commentSection: { backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  commentBox: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },
  commentCard: {
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  cmtAuthor: { fontWeight: "700" },
  cmtText: { fontSize: 14 },
  cmtTime: { fontSize: 11, color: "#777" },
});
