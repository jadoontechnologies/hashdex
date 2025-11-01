import React, { useEffect, useState, useContext } from 'react';
import { FlatList, RefreshControl } from 'react-native';
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

    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Snapshot will auto update, so just reset refreshing
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
