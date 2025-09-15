import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList } from 'react-native';
import { AuthContext } from '../../state/AuthContext';
import { db } from '../../services/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export default function NotificationsScreen() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  useEffect(()=>{ (async()=>{
    const q = query(collection(db,'users', user.uid, 'notifications'), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    setItems(snap.docs.map(d => ({ id:d.id, ...d.data() })));
  })(); },[user]);

  return <FlatList style={{padding:12}} data={items} keyExtractor={i=>i.id} renderItem={({item}) => <Text style={{padding:10, backgroundColor:'#fff', marginVertical:6, borderRadius:10}}>{item.message}</Text>} />;
}
