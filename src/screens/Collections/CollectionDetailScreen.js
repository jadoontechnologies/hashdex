import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, now } from '../../services/firebase';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc } from 'firebase/firestore';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';

export default function CollectionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [coll, setColl] = useState(null);
  const [items, setItems] = useState([]);
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    const ss = await getDoc(doc(db,'collections', id)); setColl({ id, ...ss.data() });
    const list = await getDocs(collection(db,'collections', id, 'items'));
    setItems(list.docs.map(d => ({ id:d.id, ...d.data() })));
  };
  useEffect(()=>{ load(); },[id]);

  const addLink = async () => {
    if(!link.trim()) return;
    await addDoc(collection(db,'collections', id, 'items'), { type:'link', url:link, text:'', order: items.length+1, createdAt: now(), updatedAt: now() });
    await updateDoc(doc(db,'collections', id), { 'stats.items': (coll?.stats?.items||0)+1, updatedAt: now() });
    setLink(''); load();
  };
  const addNote = async () => {
    if(!note.trim()) return;
    await addDoc(collection(db,'collections', id, 'items'), { type:'note', text:note, order: items.length+1, createdAt: now(), updatedAt: now() });
    await updateDoc(doc(db,'collections', id), { 'stats.items': (coll?.stats?.items||0)+1, updatedAt: now() });
    setNote(''); load();
  };

  if(!coll) return null;
  return (
    <View style={{flex:1, padding:12}}>
      <Text style={styles.title}>{coll.title}</Text>
      <Text style={styles.meta}>{coll.visibility} · {coll.stats?.items||0} items</Text>

      <TextInput placeholder="Add link" value={link} onChangeText={setLink} />
      <Button title="Add link" onPress={addLink} />
      <TextInput placeholder="Add note" value={note} onChangeText={setNote} />
      <Button title="Add note" onPress={addNote} />

      <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item}) => (
        <View style={styles.item}>
          <Text style={{fontWeight:'600'}}>{item.type.toUpperCase()}</Text>
          <Text>{item.url || item.text}</Text>
        </View>
      )}/>
    </View>
  );
}
const styles = StyleSheet.create({
  title:{ fontSize:22, fontWeight:'800' },
  meta:{ color:'#777', marginBottom:12 },
  item:{ backgroundColor:'#fff', padding:12, borderRadius:12, marginVertical:6 }
});
