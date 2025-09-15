import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import PostCard from '../../components/PostCard';
import { AuthContext } from '../../state/AuthContext';
import { addComment, toggleLike, toggleSave } from '../../services/interactions';

export default function PostDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubPost = onSnapshot(doc(db,'posts',id), snap => setPost({ id, ...snap.data() }));
    const unsubComments = onSnapshot(query(collection(db,'posts',id,'comments'), orderBy('createdAt','asc')), snap => {
      setComments(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    });
    const unsubLikes = onSnapshot(doc(db,'posts',id,'likes',user.uid), snap => setLiked(snap.exists()));
    const unsubSaves = onSnapshot(doc(db,'posts',id,'saves',user.uid), snap => setSaved(snap.exists()));

    return ()=>{ unsubPost(); unsubComments(); unsubLikes(); unsubSaves(); };
  }, [id]);

  const onSend = async () => {
    if(!newComment.trim()) return;
    await addComment(id, user, newComment.trim());
    setNewComment('');
  };

  return (
    <View style={styles.wrap}>
      {post && <PostCard post={post} />}
      <View style={styles.actions}>
        <TouchableOpacity onPress={()=>toggleLike(id, user.uid, liked)}>
          <Text>{liked ? '❤️ Unlike' : '🤍 Like'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>toggleSave(id, user.uid, saved)}>
          <Text>{saved ? '🔖 Saved' : '🔖 Save'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.h}>Comments</Text>
      <FlatList data={comments} keyExtractor={i=>i.id} renderItem={({item}) => (
        <Text style={styles.cmt}><Text style={{fontWeight:'600'}}>{item.author?.displayName}:</Text> {item.text}</Text>
      )} />
      <View style={styles.commentBox}>
        <TextInput placeholder="Write a comment..." style={{flex:1}} value={newComment} onChangeText={setNewComment}/>
        <TouchableOpacity onPress={onSend}><Text style={{color:'#ff6a3d'}}>Send</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{flex:1},
  h:{ fontWeight:'700', fontSize:16, paddingHorizontal:12, paddingTop:8 },
  cmt:{ paddingHorizontal:12, paddingVertical:6 },
  actions:{ flexDirection:'row', justifyContent:'space-around', padding:10, borderTopWidth:1, borderTopColor:'#eee' },
  commentBox:{ flexDirection:'row', alignItems:'center', borderTopWidth:1, borderColor:'#eee', padding:8 }
});
