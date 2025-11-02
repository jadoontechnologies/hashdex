// src/screens/Collections/CreateCollectionScreen.js
import React, { useState, useContext, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

export default function CreateCollectionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [cover, setCover] = useState(null);
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 🔹 Pick cover image and upload to Cloudinary
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

  // 🔹 Add item (text, image, video)
  const addItem = async (type) => {
    if (type === 'text') {
      Alert.prompt(
        'Add Text',
        'Enter your item text',
        (text) => {
          if (text.trim()) setItems((prev) => [...prev, { type, text: text.trim() }]);
        }
      );
    } else {
      // Image / video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          type === 'image'
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        setUploading(true);
        const url = await uploadToCloudinary(localUri, type);
        setUploading(false);
        if (url) setItems((prev) => [...prev, { type, text: url }]);
        else Alert.alert('Upload failed', `Could not upload ${type}.`);
      }
    }
  };

  // 🔹 Delete item
  const deleteItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 🔹 Create collection
  const createCollection = async () => {
    if (!user?.uid) return Alert.alert('User not loaded');
    if (!title.trim()) return Alert.alert('Validation', 'Collection name is required');

    const cleanTitle = title.trim();
    const payload = {
      ownerId: user.uid,
      title: cleanTitle,
      description: desc,
      visibility,
      cover: cover ? { url: cover } : {},
      stats: { items: items.length, saves: 0, shares: 0, views: 0 },
      createdAt: now(),
      updatedAt: now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'collections'), payload);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await addDoc(collection(db, 'collections', docRef.id, 'items'), {
          type: it.type,
          text: it.text,
          order: i + 1,
          createdAt: now(),
          updatedAt: now(),
        });
      }
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
        ref={flatListRef}
        data={items}
        keyExtractor={(i, idx) => i.text + idx}
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

            {/* Add Item Buttons */}
            <View style={styles.addItemRow}>
              {['text', 'image', 'video'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.addItemBtn}
                  onPress={() => addItem(type)}
                >
                  <Ionicons
                    name={
                      type === 'text'
                        ? 'text'
                        : type === 'image'
                        ? 'image'
                        : 'videocam'
                    }
                    size={20}
                    color="#fff"
                  />
                  <Text style={{ color: '#fff', marginLeft: 4 }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            {item.type !== 'text' ? (
              <Image
                source={{ uri: item.text }}
                style={item.type === 'image' ? styles.itemImage : styles.itemVideo}
              />
            ) : null}
            <Text style={{ fontWeight: '600', marginTop: 4 }}>{item.type.toUpperCase()}</Text>
            {item.type === 'text' && <Text>{item.text}</Text>}
            <View style={styles.itemButtons}>
              <TouchableOpacity onPress={() => deleteItem(index)} style={styles.iconButton}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  addItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  addItemBtn: {
    flexDirection: 'row',
    backgroundColor: '#ff6a3d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  item: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  itemButtons: { flexDirection: 'row', marginTop: 5 },
  iconButton: { marginRight: 10 },
  itemImage: { width: '100%', height: 150, borderRadius: 12 },
  itemVideo: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#000' },
  saveButtonContainer: { position: 'absolute', bottom: 10, left: 16, right: 16 },
});
