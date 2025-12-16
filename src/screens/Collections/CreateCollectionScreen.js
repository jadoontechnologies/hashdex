// src/screens/Collections/CreateCollectionScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../state/AuthContext';
import { db, now } from '../../services/firebase';
import { addDoc, collection } from 'firebase/firestore';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { uploadToCloudinary } from '../../services/cloudinary';

export default function CreateCollectionScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Pick cover image
  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setUploading(true);
      const url = await uploadToCloudinary(localUri, 'image');
      setUploading(false);
      if (url) setCover(url);
      else Alert.alert('Upload failed', 'Could not upload cover image.');
    }
  };

  // Create collection
  const createCollection = async () => {
    if (!user?.uid) return Alert.alert('User not loaded');
    if (!title.trim()) return Alert.alert('Validation', 'Collection name is required');

    const payload = {
      ownerId: user.uid,
      title: title.trim(),
      description: desc,
      visibility,
      cover: cover ? { url: cover } : {},
      stats: { items: 0, saves: 0, shares: 0, views: 0 },
      createdAt: now(),
      updatedAt: now(),
    };

    try {
      await addDoc(collection(db, 'collections'), payload);
      Alert.alert('Success', 'Collection created');
      navigation.navigate('Collections');
    } catch (err) {
      console.error('🔥 createCollection error:', err.message);
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Header title="Create Collection" showBackButton />

      <FlatList
        data={[]}
        keyExtractor={(item, idx) => idx.toString()}
        ListHeaderComponent={
          <>
            {/* Cover Picker */}
            <TouchableOpacity style={styles.coverBox} onPress={pickCover}>
              {uploading ? (
                <ActivityIndicator size="large" color="#ff6a3d" />
              ) : cover ? (
                <Image source={{ uri: cover }} style={styles.coverImage} />
              ) : (
                <Text style={styles.addCoverText}>＋ Add Cover</Text>
              )}
            </TouchableOpacity>

            {/* Collection Info */}
            <View style={styles.card}>
              <RNTextInput
                placeholder="Collection Name"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <RNTextInput
                placeholder="Description"
                value={desc}
                onChangeText={setDesc}
                style={[styles.input, { height: 80 }]}
                multiline
              />
            </View>

            {/* Visibility */}
            <View style={styles.visibilityRow}>
              {['public', 'friends', 'private'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.visibilityBtn, visibility === opt && styles.selectedVisibility]}
                  onPress={() => setVisibility(opt)}
                >
                  <Text style={{ color: visibility === opt ? '#fff' : '#333' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <View style={styles.saveButtonContainer}>
        <Button title="Create Collection" onPress={createCollection} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coverBox: {
    width: '100%',
    height: 150,
    backgroundColor: '#eee',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  coverImage: { width: '100%', height: '100%', borderRadius: 12 },
  addCoverText: { fontSize: 18, color: '#888' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f7f7f7',
  },
  visibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  visibilityBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#888',
  },
  selectedVisibility: { backgroundColor: '#ff6a3d' },
  saveButtonContainer: { position: 'absolute', bottom: 10, left: 16, right: 16 },
});
