import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../state/AuthContext';
import { follow, unfollow } from '../../services/social';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ProfileScreen({ navigation, route }) {
  const { user, profile, signOut } = useContext(AuthContext);
  const viewingOwn = !route.params || route.params.uid === user.uid;
  const [otherProfile, setOtherProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const targetId = route.params?.uid || user.uid;

  useEffect(()=>{
    if(!viewingOwn){
      const unsub = onSnapshot(doc(db,'users',targetId), snap => setOtherProfile({ id:snap.id, ...snap.data() }));
      return ()=>unsub();
    }
  },[targetId]);

  const toggleFollow = async () => {
    if(isFollowing) await unfollow(user.uid, targetId);
    else await follow(user.uid, targetId);
    setIsFollowing(!isFollowing);
  };

  const data = viewingOwn ? profile : otherProfile;

  return (
    <View style={styles.wrap}>
      <Image source={{ uri: data?.photoURL || 'https://placehold.co/120x120' }} style={styles.avatar} />
      <Text style={styles.name}>{data?.displayName || 'User'}</Text>
      <Text style={styles.meta}>@{data?.username || 'username'}</Text>
      {viewingOwn ? (
        <View style={styles.row}>
          <TouchableOpacity onPress={()=>navigation.navigate('Friends')}><Text>Friends</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>navigation.navigate('Settings')}><Text>Settings</Text></TouchableOpacity>
          <TouchableOpacity onPress={signOut}><Text>Sign out</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.followBtn} onPress={toggleFollow}>
          <Text style={{color:'#fff'}}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({ wrap:{flex:1, alignItems:'center', paddingTop:40}, avatar:{width:96,height:96,borderRadius:48}, name:{fontSize:22,fontWeight:'800', marginTop:8}, meta:{ color:'#888' }, row:{ flexDirection:'row', gap:20, marginTop:20 }, followBtn:{ marginTop:16, backgroundColor:'#ff6a3d', paddingVertical:8, paddingHorizontal:20, borderRadius:20 }});
