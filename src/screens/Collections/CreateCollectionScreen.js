import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import PrivacyPicker from '../../components/PrivacyPicker';
import { db, now } from '../../services/firebase';
import { AuthContext } from '../../state/AuthContext';
import { addDoc, collection } from 'firebase/firestore';

export default function CreateCollectionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState('private');

  const create = async () => {
    if(!title.trim()) return Alert.alert('Name your collection');
    const payload = {
      ownerId: user.uid, title, description: desc, visibility,
      cover: {}, stats:{ items:0, saves:0, shares:0, views:0 }, tags:[], createdAt: now(), updatedAt: now()
    };
    const docRef = await addDoc(collection(db,'collections'), payload);
    navigation.replace('CollectionDetail', { id: docRef.id });
  };

  return (
    <View style={styles.wrap}>
      <TextInput placeholder="Collection name" value={title} onChangeText={setTitle} />
      <TextInput placeholder="Description" value={desc} onChangeText={setDesc} />
      <PrivacyPicker value={visibility} onChange={setVisibility} />
      <Button title="Create" onPress={create} />
    </View>
  );
}
const styles = StyleSheet.create({ wrap:{ flex:1, padding:16 } });
