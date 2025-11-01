import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PostCard from '../../components/PostCard';

export default function PublicFeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Snapshot auto refresh
    setRefreshing(false);
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { id: item.id })} />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
