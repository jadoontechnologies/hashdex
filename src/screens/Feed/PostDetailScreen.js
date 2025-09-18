import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { db } from '../../services/firebase';
import { doc, collection, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { AuthContext } from '../../state/AuthContext';
import { addComment, toggleLike, toggleSave } from '../../services/interactions';

export default function PostDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubPost = onSnapshot(doc(db, 'posts', id), snap => setPost({ id, ...snap.data() }));
    const unsubComments = onSnapshot(query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'asc')), snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubPost(); unsubComments(); };
  }, [id]);

  const onSend = async () => {
    if (!newComment.trim()) return;
    await addComment(id, user, newComment.trim());
    setNewComment('');
  };

  const onDelete = async () => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDoc(doc(db, 'posts', id)); navigation.goBack(); } }
    ]);
  };

  return (
    <ScrollView style={styles.wrap}>
      {post && (
        <View style={styles.postContainer}>
          <View style={styles.header}>
            <Text style={styles.author}>{post.author.displayName}</Text>
            <Text style={styles.timestamp}>{post.createdAt?.toDate().toLocaleString()}</Text>
          </View>
          <Text style={styles.text}>{post.text}</Text>
          {post.attachments?.map((uri, i) => <Image key={i} source={{ uri }} style={styles.image} />)}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => toggleLike(id, user.uid, liked)}><Text>{liked ? '❤️ Unlike' : '🤍 Like'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => toggleSave(id, user.uid, saved)}><Text>{saved ? '🔖 Saved' : '🔖 Save'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Post Menu', '', [
              { text: 'Edit', onPress: () => navigation.navigate('EditPost', { id }) },
              { text: 'Privacy', onPress: () => Alert.alert('Change Privacy') },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
              { text: 'Cancel', style: 'cancel' }
            ])}><Text>⋮ Menu</Text></TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.h}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Text style={styles.cmt}><Text style={{ fontWeight: '600' }}>{item.author?.displayName}:</Text> {item.text}</Text>
        )}
      />

      <View style={styles.commentBox}>
        <TextInput placeholder="Write a comment..." style={{ flex: 1 }} value={newComment} onChangeText={setNewComment} />
        <TouchableOpacity onPress={onSend}><Text style={{ color: '#ff6a3d' }}>Send</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 12 },
  postContainer: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#eee' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  author: { fontWeight: '700', fontSize: 16 },
  timestamp: { fontSize: 12, color: '#555' },
  text: { marginBottom: 8, fontSize: 15 },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
  h: { fontWeight: '700', fontSize: 16, marginTop: 12 },
  cmt: { paddingVertical: 4 },
  commentBox: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', padding: 8 },
});
