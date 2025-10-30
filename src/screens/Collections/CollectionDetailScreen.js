// screens/Collections/CollectionDetailScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { MaterialIcons, Feather } from '@expo/vector-icons';

// theme colors
const theme = {
  primary: '#ff6a3d',
  background: '#f9f9f9',
  text: '#222',
  muted: '#777',
  border: '#eee',
};

export default function CollectionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [coll, setColl] = useState(null);
  const [items, setItems] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [visibility, setVisibility] = useState('public');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    async function load() {
      const ss = await getDoc(doc(db, 'collections', id));
      if (ss.exists()) setColl({ id, ...ss.data() });

      const q = query(collection(db, 'collections', id, 'items'), orderBy('createdAt', 'asc'));
      const list = await getDocs(q);
      const arr = list.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(arr);

      // derive hashtags for demo
      const setTags = new Set();
      arr.forEach(i => {
        if (i.visibility === visibility) (i.hashtags || []).forEach(t => setTags.add(t));
      });
      setHashtags(Array.from(setTags).sort());
    }
    load();
  }, [id, visibility]);

  const shareCollection = async () => {
    try {
      const message = `Check out my collection: ${coll.title}\n\n${coll.description || ''}`;
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share collection');
    }
  };

  const deleteCollection = async () => {
    setShowMenu(false);
    Alert.alert('Delete Collection', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'collections', id));
          navigation.goBack();
        },
      },
    ]);
  };

  const renderTextWithHashtags = (text = '') => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) {
        return (
          <Text key={idx} style={{ fontWeight: '700', color: theme.primary }}>
            {part}
          </Text>
        );
      }
      return <Text key={idx}>{part}</Text>;
    });
  };

  if (!coll) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const visiblePosts = items.filter(i => i.visibility === visibility);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.customHeader}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{coll.title}</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setShowMenu(true)}>
          <MaterialIcons name="more-vert" size={28} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <FlatList
        data={visiblePosts}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={
          <>
            {/* cover image */}
            {coll.cover?.url ? (
              <Image source={{ uri: coll.cover.url }} style={styles.coverImage} />
            ) : null}

            {/* description */}
            {coll.description ? (
              <View style={styles.descCard}>
                <Text style={{ color: theme.text }}>{coll.description}</Text>
              </View>
            ) : null}

            {/* visibility tabs */}
            <View style={styles.visibilityRow}>
              {['public', 'friends', 'private'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.visibilityBtn, visibility === opt && styles.selectedVisibility]}
                  onPress={() => setVisibility(opt)}
                >
                  <Text style={{ color: visibility === opt ? '#fff' : theme.text }}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* hashtags */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <Text style={{ fontWeight: '700', color: theme.text }}>Hashtags</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            >
              {hashtags.length === 0 ? (
                <Text style={{ color: theme.muted }}>No tags</Text>
              ) : (
                hashtags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() =>
                      navigation.navigate('HashtagPosts', { collectionId: id, hashtag: tag, visibility })
                    }
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* posts header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Text style={{ fontWeight: '700', color: theme.text }}>Posts</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postType}>{item.type?.toUpperCase()}</Text>
            {item.type === 'link' ? (
              <Text style={{ color: theme.primary }}>{item.url}</Text>
            ) : (
              <Text>{renderTextWithHashtags(item.text)}</Text>
            )}
            <Text style={styles.postDate}>
              {new Date(
                item.createdAt?.seconds ? item.createdAt.seconds * 1000 : Date.now(),
              ).toLocaleString()}
            </Text>
          </View>
        )}
      />

      {/* menu modal */}
      <Modal visible={showMenu} animationType="slide" transparent onRequestClose={() => setShowMenu(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowMenu(false)} />
          <LinearGradient
            colors={["#F9F87180", "#F28A4780", "#DE5C7680"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuSheet}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('EditCollection', { id });
              }}
            >
              <Feather name="edit" size={20} color="#fff" />
              <Text style={styles.menuText}>Edit Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={shareCollection}>
              <Feather name="share" size={20} color="#fff" />
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: "rgba(220,38,38,0.66)" }]}
              onPress={deleteCollection}
            >
              <MaterialIcons name="delete-outline" size={20} color="#fff" />
              <Text style={[styles.menuText, { color: '#fff' }]}>Delete Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuClose} onPress={() => setShowMenu(false)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  customHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    paddingTop: 25,
  },
  backBtn: { position: 'absolute', left: 16, top: 30 },
  backIcon: { fontSize: 30, color: 'white', fontWeight: '700' },
  menuBtn: { position: 'absolute', right: 16, top: 35 },

  coverImage: { width: '100%', height: 160, resizeMode: 'cover' },
  descCard: {
    backgroundColor: '#fff',
    padding: 12,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },

  visibilityRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  visibilityBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  selectedVisibility: { backgroundColor: theme.primary },

  tagChip: {
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tagText: { color: '#fff', fontWeight: '600' },

  postCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  postType: { fontWeight: '700', marginBottom: 4, color: theme.primary },
  postDate: { marginTop: 6, fontSize: 12, color: theme.muted },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSheet: {
    backgroundColor: "rgba(30,30,30,0.95)",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuText: { color: '#fff', fontSize: 16, marginLeft: 10 },
  menuClose: { marginTop: 10, alignItems: 'center' },
});
