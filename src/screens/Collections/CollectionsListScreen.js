import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useContext } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AuthContext } from '../../state/AuthContext';
import Header from '../../components/Header'; // ✅ shared header

export default function CollectionsListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'collections'), where('ownerId', '==', user.uid))
      );
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by updatedAt (newest first)
      data.sort((a, b) => {
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime;
      });

      setItems(data);
    } catch (err) {
      console.error('Error loading collections:', err);
    }
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
        <Image source={{ uri: item.cover.url }} style={styles.coverCircle} />
      ) : (
        <View style={styles.placeholderCircle}>
          <Text style={styles.placeholderText}>{item.title?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
      )}
      <Text style={styles.collectionTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Shared Header */}
      <Header
        title="Collections"
        rightIcon="add"
        onRightPress={() => navigation.navigate('CreateCollection')}
        showBackButton={true}
      />

      {/* Collections Grid */}
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#888', fontSize: 16 }}>No collections yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
