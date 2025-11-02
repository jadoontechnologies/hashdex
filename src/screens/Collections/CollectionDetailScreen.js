// screens/Collections/CollectionDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { MaterialIcons, Feather } from '@expo/vector-icons';

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
      try {
        const ss = await getDoc(doc(db, 'collections', id));
        if (ss.exists()) setColl({ id, ...ss.data() });

        const q = query(collection(db, 'collections', id, 'items'), orderBy('createdAt', 'asc'));
        const list = await getDocs(q);
        const arr = list.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(arr);

        const setTags = new Set();
        arr.forEach((i) => {
          (i.hashtags || []).forEach((t) => setTags.add(t));
        });
        setHashtags(Array.from(setTags).sort());
      } catch (err) {
        console.error('Error loading collection:', err);
      }
    }
    load();
  }, [id]);

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
          try {
            await deleteDoc(doc(db, 'collections', id));
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Collections');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete collection');
          }
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

  const visiblePosts = items.filter((i) => i.visibility === visibility);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={['#F9F871', '#F28A47', '#DE5C76']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.customHeader}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Collections');
          }}
        >
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
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={
          <>
            {coll.cover?.url ? (
              <Image source={{ uri: coll.cover.url }} style={styles.coverImage} />
            ) : null}

            {coll.description ? (
              <View style={styles.descCard}>
                <Text style={{ color: theme.text }}>{coll.description}</Text>
              </View>
            ) : null}

            <View style={styles.visibilityRow}>
              {['public', 'friends', 'private'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.visibilityBtn, visibility === opt && styles.selectedVisibility]}
                  onPress={() => setVisibility(opt)}
                >
                  <Text style={{ color: visibility === opt ? '#fff' : theme.text }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
                hashtags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() =>
                      navigation.navigate('HashtagPosts', {
                        collectionId: id,
                        hashtag: tag,
                        visibility,
                      })
                    }
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <Text style={{ fontWeight: '700', color: theme.text }}>Posts</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postType}>{item.type?.toUpperCase()}</Text>

            {/* ✅ Show image/video if available */}
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 8 }} />
            )}
            {item.videoUrl && (
              <Text style={{ color: theme.primary, marginBottom: 8 }}>🎬 Video: {item.videoUrl}</Text>
            )}

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

      {/* Paper-style dropdown menu */}
      {showMenu && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: 70,
              right: 10,
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingVertical: 6,
              width: 180,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('EditCollection', { id });
              }}
            >
              <Feather name="edit" size={18} color={theme.text} />
              <Text style={styles.menuOptionText}>Edit Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={shareCollection}>
              <Feather name="share" size={18} color={theme.text} />
              <Text style={styles.menuOptionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={deleteCollection}>
              <MaterialIcons name="delete-outline" size={18} color="red" />
              <Text style={[styles.menuOptionText, { color: 'red' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
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

  // dropdown menu styles
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuOptionText: {
    fontSize: 15,
    color: theme.text,
    marginLeft: 10,
  },
});
