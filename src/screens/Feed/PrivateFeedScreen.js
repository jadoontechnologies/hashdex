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

  const load = () => {
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'private'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  useEffect(() => {
    const unsub = load();
    return unsub;
  }, []);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        />
      )}
    />
  );
}
