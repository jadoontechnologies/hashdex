import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function PostCard({ post, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: post.author?.photoURL || 'https://placekitten.com/80/80' }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{post.author?.displayName || 'User'}</Text>
          <Text style={styles.meta}>{post.visibility?.toUpperCase()}</Text>
        </View>
      </View>
      {post.text?.length ? <Text style={styles.text}>{post.text}</Text> : null}
      {post.attachments?.[0]?.url ? (
        <Image source={{ uri: post.attachments[0].url }} style={styles.img} />
      ) : null}
      <View style={styles.footer}>
        <Text>❤️ {post.stats?.likes || 0}</Text>
        <Text>💬 {post.stats?.comments || 0}</Text>
        <Text>🔖 {post.stats?.saves || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card:{ backgroundColor:'#fff', marginVertical:8, borderRadius:16, overflow:'hidden', elevation:1 },
  header:{ flexDirection:'row', padding:12, gap:10, alignItems:'center' },
  avatar:{ width:36, height:36, borderRadius:18, backgroundColor:'#ddd' },
  name:{ fontWeight:'600' },
  meta:{ color:'#888', fontSize:12 },
  text:{ paddingHorizontal:12, paddingBottom:8, fontSize:15 },
  img:{ width:'100%', height:220, backgroundColor:'#eee' },
  footer:{ flexDirection:'row', justifyContent:'space-around', padding:10, borderTopWidth:1, borderTopColor:'#f2f2f2' }
});
