import React, { useEffect, useState, useContext } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { collection, query, orderBy, onSnapshot, getDoc, getDocs, doc } from 'firebase/firestore';
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
    if (!user) return;
    try {
      // Load following
      const followingColl = collection(db, 'users', user.uid, 'following');
      const followingSnap = await getDocs(followingColl);
      const followingIds = followingSnap.docs.map(d => d.id);

      // Load followers
      const followersColl = collection(db, 'users', user.uid, 'followers');
      const followersSnap = await getDocs(followersColl);
      const followersIds = followersSnap.docs.map(d => d.id);

      // Merge lists
      const friendIds = Array.from(new Set([...followingIds, ...followersIds]));
      setFriends(friendIds);

    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };


  useEffect(() => {
    loadFriends();
  }, [user]);


  // Load posts (friends' posts + my own posts with 'friends' visibility only)
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, snap => {
      const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const visiblePosts = allPosts.filter(post => {
        if (!post.author || !post.author.id) return false;

        // Exclude private posts
        if (post.visibility === 'private') return false;

        // Show my own posts only if 'friends'
        if (post.author.id === user.uid && post.visibility === 'friends') return true;

        // Show friends' posts with 'friends' visibility
        if (post.visibility === 'friends' && friends.includes(post.author.id)) return true;

        return false;
      });

      setPosts(visiblePosts);
    });

    return unsub;
  }, [user, friends]);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadFriends();
            setRefreshing(false);
          }}
        />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => navigation.navigate('PostDetail', { id: item.id })}
        />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
