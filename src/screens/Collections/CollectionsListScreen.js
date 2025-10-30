import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState, useContext } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AuthContext } from '../../state/AuthContext';

export default function CollectionsListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  const load = async () => {
    const snap = await getDocs(query(collection(db, 'collections'), where('ownerId', '==', user.uid)));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort by updatedAt (newest first)
    data.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || 0;
      return bTime - aTime;
    });

    setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) load();
    }, [user])
  );

const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.collectionCard}
    onPress={() => navigation.navigate('CollectionDetail', { id: item.id })}
  >
    {item.cover?.url ? (
      <Image
        source={{ uri: item.cover.url }}
        style={styles.coverCircle}
      />
    ) : (
      <View style={styles.placeholderCircle}>
        <Text style={styles.placeholderText}>{item.title?.charAt(0) || '?'}</Text>
      </View>
    )}
    <Text style={styles.collectionTitle} numberOfLines={1}>{item.title}</Text>
  </TouchableOpacity>
);


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
          <Text style={{ fontSize: 28, color: '#fff', fontWeight: '700' }}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collections</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateCollection')}>
          <Text style={{ fontSize: 28, color: '#fff', fontWeight: '700' }}>＋</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Collections Grid */}
      <FlatList
        key="2"
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  backBtn: { position: 'absolute', left: 16, top: 30 },
  addBtn: { position: 'absolute', right: 16, top: 30 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', paddingTop: 8 },

collectionCard: {
    flex: 0.48,
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 20,
  },
  placeholderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#555',
  },
  collectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  coverCircle: {
  width: 80,
  height: 80,
  borderRadius: 40,
  resizeMode: 'cover',
},
});
