import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import PrivacyPicker from '../../components/PrivacyPicker';
import { db, now } from '../../services/firebase';
import { AuthContext } from '../../state/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { trackHashtags } from '../../services/hashtags';

export default function ComposeScreen({ navigation }) {
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const { user, profile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const post = async () => {
    try {
      if (!text.trim()) return Alert.alert('Write something');
      setLoading(true);
      const hashtags = (text.match(/#\w+/g)||[]).map(t=>t.slice(1).toLowerCase());
      const payload = {
        authorId: user.uid,
        author: { displayName: profile?.displayName || user.email, photoURL: profile?.photoURL || '' },
        text,
        attachments: [],
        hashtags,
        visibility,
        stats: { likes:0, comments:0, saves:0 },
        createdAt: now(),
        updatedAt: now(),
      };
      await addDoc(collection(db,'posts'), payload);
      if(hashtags.length) await trackHashtags(hashtags);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed to post', e.message);
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Create Post</Text>
      <PrivacyPicker value={visibility} onChange={setVisibility} />
      <TextInput placeholder="What's on your mind? #hashtags" multiline style={{height:150, textAlignVertical:'top'}} value={text} onChangeText={setText} />
      <Button title={loading ? 'Posting...' : 'Post'} onPress={post} />
    </View>
  );
}
const styles = StyleSheet.create({ wrap:{ flex:1, padding:16 }, title:{ fontSize:22, fontWeight:'700', marginBottom:8 } });
