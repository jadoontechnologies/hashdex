import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, TextInput as RNTextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../state/AuthContext';
import { db, now, storage } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { trackHashtags } from '../../services/hashtags';

export default function ComposeScreen({ navigation }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [collectionName, setCollectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useContext(AuthContext);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.cancelled) setAttachments([...attachments, result.uri]);
  };

  const uploadAttachments = async () => {
    const urls = [];
    for (const uri of attachments) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const post = async () => {
    if (!text.trim() && attachments.length === 0) return Alert.alert('Write something or attach media');
    setLoading(true);
    try {
      const hashtags = (text.match(/#\w+/g) || []).map(t => t.slice(1).toLowerCase());
      const mediaUrls = await uploadAttachments();

      const payload = {
        authorId: user.uid,
        author: { displayName: profile?.displayName || user.email, photoURL: profile?.photoURL || '' },
        text,
        attachments: mediaUrls,
        hashtags,
        collection: collectionName || null,
        visibility: 'friends',
        stats: { likes: 0, comments: 0, saves: 0 },
        createdAt: now(),
        updatedAt: now(),
      };

      await addDoc(collection(db, 'posts'), payload);
      if (hashtags.length) await trackHashtags(hashtags);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed to post', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Top Bar */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileText}>👤</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* Message Input */}
        <View style={styles.messageBox}>
          <RNTextInput
            placeholder="What's on your mind? #hashtags"
            multiline
            style={styles.textInput}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.attachment}>📎</Text>
          </TouchableOpacity>
        </View>

        {/* Collection Input */}
        <View style={styles.collectionBox}>
          <RNTextInput
            placeholder="Add Collection (Optional)"
            style={styles.collectionInput}
            value={collectionName}
            onChangeText={setCollectionName}
          />
          <TouchableOpacity onPress={() => Alert.alert('Add Collection')}>
            <Text style={styles.addButton}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Attachments Preview */}
        <View style={styles.attachments}>
          {attachments.map((uri, i) => <Image key={i} source={{ uri }} style={styles.image} />)}
        </View>
      </ScrollView>

      {/* Bottom Post Button */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomBar}
      >
        <TouchableOpacity style={styles.postBtn} onPress={post}>
          <Text style={styles.postText}>{loading ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 30,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  back: { paddingLeft: 15, fontSize: 30, color: '#fff', fontWeight: 700 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileText: { fontSize: 20, color: '#fff', paddingRight: 15, },
  content: { flex: 1, padding: 12 },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F28A47',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  textInput: { flex: 1, minHeight: 80, textAlignVertical: 'top' },
  attachment: { fontSize: 24, marginLeft: 8 },
  collectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DE5C76',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  collectionInput: { flex: 1, height: 40 },
  addButton: { fontSize: 28, marginLeft: 8, color: '#DE5C76', fontWeight: '700' },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  image: { width: 80, height: 80, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  bottomBar: {
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  postBtn: { backgroundColor: 'transparent', borderRadius: 20, paddingVertical: 14, alignItems: 'center' },
  postText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
