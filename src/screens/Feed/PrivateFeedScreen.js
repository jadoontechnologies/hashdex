// src/screens/Feed/PrivateFeedScreen.js
import React, { useEffect, useState, useContext } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AuthContext } from '../../state/AuthContext';
import PostCard from '../../components/PostCard';

export default function PrivateFeedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'private'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetchedPosts = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(fetchedPosts);
    });

    return () => unsub();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Snapshot updates automatically; just reset refreshing
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
          <Text style={{ color: '#888' }}>No private posts yet.</Text>
        </View>
      }
    />
  );
}
