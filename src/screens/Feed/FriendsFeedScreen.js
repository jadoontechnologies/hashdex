// src/screens/Feed/FriendsFeedScreen.js
import React, { useEffect, useState, useContext } from 'react';
import { FlatList, RefreshControl, View, Text } from 'react-native';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AuthContext } from '../../state/AuthContext';
import PostCard from '../../components/PostCard';

export default function FriendsFeedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState([]);

  // Load friends (following + followers)
  const loadFriends = async () => {
    if (!user) return [];
    try {
      const followingSnap = await getDocs(collection(db, 'users', user.uid, 'following'));
      const followersSnap = await getDocs(collection(db, 'users', user.uid, 'followers'));

      const friendIds = Array.from(
        new Set([
          ...followingSnap.docs.map(d => d.id),
          ...followersSnap.docs.map(d => d.id),
        ])
      );

      setFriends(friendIds);
      return friendIds;
    } catch (err) {
      console.error('Error loading friends:', err);
      return [];
    }
  };

  // Load posts based on friends
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const visiblePosts = allPosts.filter(post => {
        const authorId = post.authorId || post.author?.id;
        if (!authorId) return false;
        if (post.visibility === 'private') return false;
        if (post.visibility === 'friends' && (authorId === user.uid || friends.includes(authorId))) return true;
        if (post.visibility === 'public') return true;
        return false;
      });

      setPosts(visiblePosts);
    });

    return () => unsub();
  }, [user, friends]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>No posts from your friends yet.</Text>
        </View>
      }
    />
  );
}
