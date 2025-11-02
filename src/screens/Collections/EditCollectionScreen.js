// screens/Collections/EditCollectionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  TextInput as RNTextInput,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/Button';
import PrivacyPicker from '../../components/PrivacyPicker';
import { db, now } from '../../services/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../../theme/colors';
import { uploadToCloudinary } from '../../services/cloudinary'; // ✅ Import Cloudinary helper

export default function EditCollectionScreen({ route, navigation }) {
  const { id } = route.params;

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [editItemData, setEditItemData] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    const loadCollection = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'collections', id));
        const data = docSnap.data();
        if (data) {
          setTitle(data.title || '');
          setDesc(data.description || '');
          setVisibility(data.visibility || 'private');
          setCover(data.cover?.url || null);
        }
        const itemsSnap = await getDocs(collection(db, 'collections', id, 'items'));
        const loadedItems = itemsSnap.docs.map((d) => {
          const itemData = d.data();
          return {
            id: d.id,
            type: itemData.type || 'text',
            url: itemData.url || '',
            text: itemData.text || '',
            ...itemData,
          };
        });
        setItems(loadedItems);
      } catch (err) {
        Alert.alert('Error', 'Failed to load collection data');
      } finally {
        setLoading(false);
      }
    };
    loadCollection();
  }, [id]);

  // ✅ Updated pickImage with Cloudinary upload
  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        const uploadedUrl = await uploadToCloudinary(localUri, 'image'); // Upload
        if (uploadedUrl) {
          setCover(uploadedUrl); // Save Cloudinary URL
          Alert.alert('Success', 'Cover image updated');
        } else {
          Alert.alert('Error', 'Failed to upload cover image');
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  }

  const saveChanges = async () => {
    if (!title.trim()) return Alert.alert('Validation', 'Collection Name is mandatory');

    try {
      await updateDoc(doc(db, 'collections', id), {
        title,
        description: desc,
        visibility,
        cover: cover ? { url: cover } : {},
        updatedAt: now(),
      });
      Alert.alert('Success', 'Collection updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update collection');
    }
  };

  const reloadItems = async () => {
    const itemsSnap = await getDocs(collection(db, 'collections', id, 'items'));
    const loadedItems = itemsSnap.docs.map((d) => {
      const itemData = d.data();
      return {
        id: d.id,
        type: itemData.type || 'text',
        url: itemData.url || '',
        text: itemData.text || '',
        ...itemData,
      };
    });
    setItems(loadedItems);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const editItem = (item) => {
    setEditItemData(item);
    setEditText(item.url || item.text || '');
    setShowEditModal(true);
  };

  const saveEditItem = async () => {
    if (!editText.trim()) return;
    const data = editItemData.type === 'link' ? { url: editText } : { text: editText };
    await updateDoc(doc(db, 'collections', id, 'items', editItemData.id), {
      ...data,
      updatedAt: now(),
    });
    setShowEditModal(false);
    setEditItemData(null);
    setEditText('');
    await reloadItems();
  };

  const deleteItem = async (itemId) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'collections', id, 'items', itemId));
          await reloadItems();
        },
      },
    ]);
  };

  if (loading) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={['#F9F871', '#F28A47', '#DE5C76']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.customHeader}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Collections');
          }}
        >
          <Text style={{ fontSize: 30, color: 'white', fontWeight: '700' }}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Collection</Text>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={
          <View style={styles.card}>
            {/* Cover with Change Button */}
            <View style={styles.coverBox}>
              {cover ? (
                <Image source={{ uri: cover }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverBox, { justifyContent: 'center' }]}>
                  <Text style={styles.addCoverText}>No Cover</Text>
                </View>
              )}
              <TouchableOpacity style={styles.changeCoverBtn} onPress={pickImage}>
                <Text style={styles.changeCoverText}>Change Cover</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Collection Name</Text>
            <RNTextInput
              placeholder="Collection Name"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={styles.sectionTitle}>Description</Text>
            <RNTextInput
              placeholder="Description"
              value={desc}
              onChangeText={setDesc}
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <PrivacyPicker value={visibility} onChange={setVisibility} style={styles.privacyPicker} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: theme.text }}>
                {(item.type || 'text').toUpperCase()}
              </Text>
              <Text style={{ color: theme.muted }}>{item.url || item.text || ''}</Text>
            </View>
            <View style={styles.itemButtons}>
              <TouchableOpacity onPress={() => editItem(item)} style={styles.iconButton}>
                <MaterialIcons name="edit" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.iconButton}>
                <MaterialIcons name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <Button title="Save Changes" onPress={saveChanges} />
      </View>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={{ fontWeight: '600', marginBottom: 10, color: theme.text }}>
              Edit {editItemData?.type || 'text'}
            </Text>
            <RNTextInput value={editText} onChangeText={setEditText} style={styles.modalInput} />
            <Button title="Save" onPress={saveEditItem} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" onPress={() => setShowEditModal(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 35,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    paddingTop: 25,
  },
  coverBox: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  coverImage: { width: '100%', height: '100%' },
  addCoverText: { fontSize: 18, color: '#888' },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff6a3db4',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeCoverText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 15,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  item: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemButtons: { flexDirection: 'row', marginLeft: 10 },
  iconButton: { marginHorizontal: 6 },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  privacyPicker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
});
