import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { db } from '../../services/firebase';
import { doc, collection, onSnapshot, query, orderBy, deleteDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { AuthContext } from '../../state/AuthContext';
import { addComment, toggleLike, toggleSave } from '../../services/interactions';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

// relative time formatter
function getRelativeTime(date) {
  if (!date) return '';
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
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubPost = onSnapshot(doc(db, 'posts', id), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setPost({ id, ...data });
        setLiked(data.likedBy?.includes(user.uid) || false);
        setSaved(data.savedBy?.includes(user.uid) || false);
        setVisibility(data.visibility || 'public');
      }
    });

    const unsubComments = onSnapshot(
      query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'asc')),
      snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubPost(); unsubComments(); };
  }, [id]);

  const onSend = async () => {
    if (!newComment.trim()) return;

    await addComment(id, {
      id: user.uid,
      displayName: user.displayName || "User",
      photoURL: user.photoURL || null
    }, newComment.trim());

    setNewComment('');
  };

  const onLike = async () => {
    const newState = !liked;
    setLiked(newState);
    await toggleLike(id, user.uid, liked);
  };

  const onSave = async () => {
    const newState = !saved;
    setSaved(newState);
    await toggleSave(id, user.uid, saved);
  };

  const onDelete = async () => {
    setShowMenu(false);
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'posts', id));
          navigation.goBack();
        }
      }
    ]);
  };

  const saveEdit = async () => {
    if (editText.trim()) {
      const updatedPayload = {
        text: editText.trim(),
        visibility,
        updatedAt: new Date(),
      };

      // 1️⃣ Update main post
      await updateDoc(doc(db, "posts", id), updatedPayload);

      // 2️⃣ Update any collection items referencing this post
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
    }
  };

  const renderComment = ({ item }) => {
    const createdAt = item.createdAt?.toDate();
    const relativeTime = createdAt ? getRelativeTime(createdAt) : '';
    return (
      <View style={styles.commentCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.cmtAuthor}>{item.author?.displayName || "User"}</Text>
          <Text style={styles.cmtTime}>{relativeTime}</Text>
        </View>
        <Text style={styles.cmtText}>{item.text}</Text>
      </View>
    );
  };

  if (!post) return <Text style={{ padding: 20 }}>Loading...</Text>;

  const createdAt = post.createdAt?.toDate();
  const relativeTime = createdAt ? getRelativeTime(createdAt) : '';

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" style={{ paddingTop: 18 }} />
        </TouchableOpacity>

        {/* 🔥 Header now changes dynamically */}
        <Text style={styles.headerTitle}>{isEditing ? "Edit Post" : "Post Detail"}</Text>
        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" style={{ paddingTop: 18 }} />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        style={styles.wrap}
        data={isEditing ? [] : comments} // hide comments when editing
        keyExtractor={i => i.id}
        renderItem={renderComment}
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
                {/* privacy inside edit */}
                <View style={styles.dropdown}>
                  <Picker
                    selectedValue={visibility}
                    onValueChange={(val) => setVisibility(val)}
                  >
                    <Picker.Item label="Public" value="public" />
                    <Picker.Item label="Friends" value="friends" />
                    <Picker.Item label="Private" value="private" />
                  </Picker>
                </View>
                <View style={styles.row}>
                  <TouchableOpacity onPress={saveEdit} style={styles.btn}>
                    <Text style={{ color: '#fff' }}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.btn, { backgroundColor: '#aaa' }]}>
                    <Text style={{ color: '#fff' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.text}>{post.text}</Text>
            )}

            {post.image && (
              <Image source={{ uri: post.image }} style={styles.image} />
            )}

            {/* actions - hidden in edit mode */}
            {!isEditing && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={onLike}>
                  <Text>{liked ? '❤️ Unlike' : '🤍 Like'} ({post.likes || 0})</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text>💬 Comment ({comments.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSave}>
                  <Text>{saved ? '🔖 Saved' : '🔖 Save'} ({post.saves || 0})</Text>
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
                <TouchableOpacity onPress={onSend}>
                  <Text style={{ color: '#ff6a3d', fontWeight: '700' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />

      {/* menu modal */}
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowMenu(false)} />

          <LinearGradient
            colors={["#F9F87180", "#F28A4780", "#DE5C7680"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuSheet}
          >
            {post.author?.id === user.uid && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => {
                  setEditText(post.text);
                  setIsEditing(true);
                  setShowMenu(false);
                }}>
                  <Feather name="edit-2" size={20} color="#fff" />
                  <Text style={styles.menuText}>Edit Post</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: "rgba(220, 38, 38, 0.66)" }]}
                  onPress={onDelete}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#fff" />
                  <Text style={[styles.menuText, { color: "#fff" }]}>Delete Post</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.menuClose} onPress={() => setShowMenu(false)}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 12 },
  headerGradient: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', paddingTop: 18 },

  postCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#ddd" },
  author: { fontWeight: '700', fontSize: 16 },
  timestamp: { fontSize: 12, color: '#777' },
  text: { marginBottom: 8, fontSize: 15 },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee' },

  editBox: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 6, minHeight: 60, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  btn: { backgroundColor: '#ff6a3d', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },

  dropdown: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginVertical: 8 },

  commentSection: { backgroundColor: '#fff', borderRadius: 10, padding: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  commentBox: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', padding: 8 },

  commentCard: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 8, marginVertical: 4 },
  cmtAuthor: { fontWeight: '600', marginBottom: 2 },
  cmtText: { fontSize: 14 },
  cmtTime: { fontSize: 11, color: '#888' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuSheet: { backgroundColor: "rgba(30,30,30,0.95)", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 12, marginBottom: 10 },
  menuText: { color: "#fff", fontSize: 16, marginLeft: 10 },
  menuClose: { marginTop: 10, alignItems: "center" },
  privacyLabel: { fontSize: 12, color: "#555", marginTop: 2 },
});

