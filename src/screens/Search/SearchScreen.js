import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import TextInput from '../../components/TextInput';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function SearchScreen(){
  const [q, setQ] = useState('');
  const [tags, setTags] = useState([]);

  const search = async (term) => {
    if(!term.trim()) return setTags([]);
    const ref = collection(db,'hashtags');
    const snap = await getDocs(ref); // naive: fetch all and filter
    setTags(snap.docs.filter(d=>d.id.includes(term.toLowerCase())).map(d=>({ id:d.id, ...d.data() })));
  };

  useEffect(()=>{ const t = setTimeout(()=>search(q),300); return ()=>clearTimeout(t); },[q]);

  return (
    <View style={{flex:1, padding:12}}>
      <TextInput placeholder="Search hashtags" value={q} onChangeText={setQ} />
      <FlatList data={tags} keyExtractor={i=>i.id} renderItem={({item}) => (
        <Text style={{padding:12}}>{`#${item.id}`} · {item.countPosts} posts</Text>
      )}/>
    </View>
  );
}
