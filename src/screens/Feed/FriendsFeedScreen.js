import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import PostCard from '../../components/PostCard';
import { AuthContext } from '../../state/AuthContext';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function FriendsFeedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    setRefreshing(true);
    // Simple version: show posts where visibility == 'friends' or author == followed user
    const q = query(collection(db, 'posts'), where('visibility','in',['friends','public']), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setRefreshing(false);
  };

  useEffect(() => { fetchFeed(); }, []);

  return (
    <FlatList
      data={posts}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchFeed} />}
      renderItem={({ item }) => <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { id: item.id })} />}
    />
  );
}
