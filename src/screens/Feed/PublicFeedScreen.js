import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { db } from '../../services/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import PostCard from '../../components/PostCard';

export default function PublicFeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]); const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    setRefreshing(true);
    const q = query(collection(db,'posts'), where('visibility','==','public'), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    setPosts(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    setRefreshing(false);
  };
  useEffect(()=>{ load(); },[]);
  return <FlatList data={posts} keyExtractor={i=>i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load}/>} renderItem={({item}) => <PostCard post={item} onPress={()=>navigation.navigate('PostDetail',{id:item.id})} />} />;
}
