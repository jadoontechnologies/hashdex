import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../../services/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { AuthContext } from '../../state/AuthContext';

export default function CollectionsListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  const load = async () => {
    const q = query(collection(db,'collections'), where('ownerId','==', user.uid), orderBy('updatedAt','desc'));
    const snap = await getDocs(q);
    setItems(snap.docs.map(d => ({ id:d.id, ...d.data() })));
  };
  useEffect(()=>{ if(user) load(); },[user]);

  return (
    <View style={{flex:1, padding:12}}>
      <TouchableOpacity style={styles.add} onPress={()=>navigation.navigate('CreateCollection')}>
        <Text style={{color:'#fff', fontWeight:'700'}}>＋ New Collection</Text>
      </TouchableOpacity>
      <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item}) => (
        <TouchableOpacity style={styles.card} onPress={()=>navigation.navigate('CollectionDetail',{ id:item.id })}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.visibility} · {item.stats?.items||0} items</Text>
        </TouchableOpacity>
      )}/>
    </View>
  );
}
const styles = StyleSheet.create({
  add:{ backgroundColor:'#ff6a3d', padding:12, borderRadius:12, alignItems:'center', marginBottom:10 },
  card:{ backgroundColor:'#fff', padding:14, borderRadius:14, marginVertical:6 },
  title:{ fontWeight:'700', fontSize:16 },
  meta:{ color:'#888', marginTop:4 }
});
