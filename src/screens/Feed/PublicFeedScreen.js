// src/screens/Feed/PublicFeedScreen.js
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PostCard from '../../components/PostCard';

export default function PublicFeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Query public posts, ordered by creation date descending
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    // Real-time snapshot listener
    const unsub = onSnapshot(q, (snap) => {
      const fetchedPosts = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
    });

    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Since snapshot auto-updates, just reset refreshing
    setRefreshing(false);
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>Loading...</Text>
        </View>
      }
    />
  );
}
