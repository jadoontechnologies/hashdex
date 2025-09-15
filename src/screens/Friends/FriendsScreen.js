import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { AuthContext } from '../../state/AuthContext';
import { db } from '../../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function FriendsScreen() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,'friends',user.uid), snap => {
      setFriends(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    });
    return ()=>unsub();
  },[user]);

  return (
    <FlatList style={{padding:12}} data={friends} keyExtractor={i=>i.id} renderItem={({item})=>(
      <Text style={{padding:10, backgroundColor:'#fff', marginVertical:4, borderRadius:8}}>{item.id} - {item.status}</Text>
    )}/>
  );
}
