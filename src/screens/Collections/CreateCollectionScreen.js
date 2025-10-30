// CreateCollectionScreen.js

import React, { useState, useContext, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/Button';
import { db, now } from '../../services/firebase';
import { AuthContext } from '../../state/AuthContext';
import { addDoc, collection } from 'firebase/firestore';

export default function CreateCollectionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [cover, setCover] = useState(null);
  const [items, setItems] = useState([]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setCover(result.assets[0].uri);
    }
  }

  const deleteItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const createCollection = async () => {
    if (!user?.uid) return Alert.alert('User not loaded');
    if (!title.trim()) return Alert.alert('Validation', 'Collection name is required');

    // ✅ Title ko lowercase me save karna
    const cleanTitle = title.trim().toLowerCase();

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
      console.log("🆕 Creating collection with title:", cleanTitle);
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
      console.error("🔥 createCollection error:", err.message);
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Collection</Text>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(i, idx) => i.text + idx}
        ListHeaderComponent={
          <>
            {/* Cover Picker */}
            <TouchableOpacity style={styles.coverBox} onPress={pickImage}>
              {cover ? (
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
                  style={[
                    styles.visibilityBtn,
                    visibility === opt && styles.selectedVisibility,
                  ]}
                  onPress={() => setVisibility(opt)}
                >
                  <Text style={{ color: visibility === opt ? '#fff' : '#333' }}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <Text style={{ fontWeight: '600' }}>{item.type.toUpperCase()}</Text>
            <Text>{item.text}</Text>
            <View style={styles.itemButtons}>
              <TouchableOpacity onPress={() => deleteItem(index)} style={styles.iconButton}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.saveButtonContainer}>
        <Button title="Create Collection" onPress={createCollection} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 14 },
  backBtn: { position: 'absolute', left: 16, top: 30 },
  backText: { fontSize: 28, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', paddingTop: 8 },
  coverBox: { width: '100%', height: 150, backgroundColor: '#eee', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  coverImage: { width: '100%', height: '100%', borderRadius: 12 },
  addCoverText: { fontSize: 18, color: '#888' },
  card: { backgroundColor: '#fff', padding: 16, marginHorizontal: 16, borderRadius: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16, backgroundColor: '#f7f7f7' },
  visibilityRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  visibilityBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#888' },
  selectedVisibility: { backgroundColor: '#ff6a3d' },
  item: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginHorizontal: 16, marginBottom: 12 },
  itemButtons: { flexDirection: 'row', marginTop: 5 },
  iconButton: { marginRight: 10 },
  saveButtonContainer: { position: 'absolute', bottom: 10, left: 16, right: 16 },
});
