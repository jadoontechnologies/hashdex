import React, { useEffect, useState, useContext } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { db } from '../../services/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import PostCard from '../../components/PostCard';
import { AuthContext } from '../../state/AuthContext';

export default function PrivateFeedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]); const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    setRefreshing(true);
    const q = query(collection(db,'posts'), where('visibility','==','private'), where('authorId','==', user.uid), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    setPosts(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    setRefreshing(false);
  };
  useEffect(()=>{ if(user) load(); },[user]);
  return <FlatList data={posts} keyExtractor={i=>i.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load}/>} renderItem={({item}) => <PostCard post={item} onPress={()=>navigation.navigate('PostDetail',{id:item.id})} />} />;
}
