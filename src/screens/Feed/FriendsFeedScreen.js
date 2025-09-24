import React, { useEffect, useState, useContext } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AuthContext } from '../../state/AuthContext';
import PostCard from '../../components/PostCard';

export default function FriendsFeedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState([]);

  // Load user's friends
  const loadFriends = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      setFriends(data.friends || []);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'posts'),
      where('visibility', 'in', ['public', 'friends']),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, snap => {
      const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = allPosts.filter(post => {
        // Safety check
        if (!post.author || !post.author.id) return false;

        if (post.visibility === "public") return true;

        // Show your own posts (even if "friends")
        if (post.visibility === "friends" && post.author.id === user.uid) return true;

        // Show posts from friends
        if (post.visibility === "friends" && friends.includes(post.author.id)) return true;

        return false;
      });

      setPosts(filtered);
    });

    return unsub;
  }, [friends]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFriends} />}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        />
      )}
    />
  );
}
