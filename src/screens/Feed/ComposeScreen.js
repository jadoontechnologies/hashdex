import React, { useState, useContext, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Alert, ScrollView, 
  TouchableOpacity, Image, TextInput as RNTextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../state/AuthContext';
import { db, now, storage } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { trackHashtags } from '../../services/hashtags';

export default function ComposeScreen({ navigation }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [collectionName, setCollectionName] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, profile } = useContext(AuthContext);

  // ✅ Ask permission once
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow access to your media library.');
      }
    })();
  }, []);

  // ✅ Image picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7
      });

      if (!result.canceled && result.assets?.length) {
        const uris = result.assets.map(a => a.uri);
        setAttachments(prev => [...prev, ...uris]);
      }
    } catch (err) {
      Alert.alert('Error picking image', err.message);
    }
  };

  // ✅ Upload with progress + detailed error log
  const uploadImageAsync = async (uri) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("📤 Uploading", uri);

        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `posts/${user.uid}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);

        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(Math.round(pct));
            console.log(`📈 Upload ${Math.round(pct)}%`);
          },
          (error) => {
            console.error("🔥 Firebase Upload Error");
            console.error("code:", error.code);
            console.error("message:", error.message);
            console.error("customData:", error.customData);
            console.error("stack:", error.stack);
            Alert.alert("Upload Error", `${error.code}\n${error.message}`);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("✅ Uploaded and got URL:", url);
            resolve(url);
          }
        );
      } catch (err) {
        console.error("🔥 Unexpected Upload Error", err);
        Alert.alert("Upload Error", err.message);
        reject(err);
      }
    });
  };

  // ✅ Post
  const post = async () => {
    if (!text.trim() && attachments.length === 0)
      return Alert.alert('Write something or attach media');
    if (!user) 
      return Alert.alert('Error', 'You must be logged in');

    setLoading(true);
    try {
      console.log("📍 Starting post with", attachments.length, "attachments");
      const mediaUrls = await Promise.all(attachments.map(uploadImageAsync));

      const hashtags = (text.match(/#\w+/g) || []).map(t => t.slice(1).toLowerCase());
      const payload = {
        authorId: user.uid,
        author: {
          displayName: profile?.displayName || user.email,
          photoURL: profile?.photoURL || ''
        },
        text,
        attachments: mediaUrls,
        hashtags,
        collection: collectionName || null,
        visibility,
        stats: { likes: 0, comments: 0, saves: 0 },
        createdAt: now(),
        updatedAt: now(),
      };

      await addDoc(collection(db, 'posts'), payload);
      console.log("✅ Post saved to Firestore");

      if (hashtags.length) await trackHashtags(hashtags);
      navigation.goBack();
    } catch (e) {
      console.error("🔥 Post failed", e);
      Alert.alert('Failed to post', `${e.code || ''}\n${e.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={{ flex: 1 }}>
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

        {progress > 0 && loading && (
          <Text style={{ color: '#DE5C76', marginBottom: 10 }}>
            Uploading... {progress}%
          </Text>
        )}

        <View style={styles.collectionBox}>
          <RNTextInput
            placeholder="Add Collection (Optional)"
            style={styles.collectionInput}
            value={collectionName}
            onChangeText={setCollectionName}
          />
        </View>

        <View style={styles.visibilityBox}>
          {['friends', 'public', 'private'].map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.visibilityOption, visibility === v && styles.selectedVisibility]}
              onPress={() => setVisibility(v)}
            >
              <Text style={{ color: visibility === v ? '#fff' : '#333' }}>{v.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.attachments}>
          {attachments.map((uri, i) => <Image key={i} source={{ uri }} style={styles.image} />)}
        </View>
      </ScrollView>

      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomBar}
      >
        <TouchableOpacity style={styles.postBtn} onPress={post}>
          <Text style={styles.postText}>{loading ? `Posting... ${progress}%` : 'Post'}</Text>
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
  },
  back: { paddingLeft: 15, fontSize: 30, color: '#fff', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileText: { fontSize: 20, color: '#fff', paddingRight: 15 },
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
  },
  collectionInput: { flex: 1, height: 40 },
  visibilityBox: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  visibilityOption: {
    borderWidth: 1,
    borderColor: '#DE5C76',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedVisibility: { backgroundColor: '#DE5C76' },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  image: { width: 80, height: 80, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  bottomBar: { padding: 6 },
  postBtn: { borderRadius: 20, paddingVertical: 14, alignItems: 'center' },
  postText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
