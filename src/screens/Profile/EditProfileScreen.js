import React, { useContext, useState } from 'react';
import { View, Alert } from 'react-native';
import { AuthContext } from '../../state/AuthContext';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, setProfile } = useContext(AuthContext);
  const [name, setName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');

  const save = async () => {
    try { 
      await updateDoc(doc(db,'users', user.uid), { displayName:name, username });
      setProfile({ ...profile, displayName:name, username });
      navigation.goBack();
    } catch(e){ Alert.alert('Error', e.message); }
  };
  return (
    <View style={{padding:16}}>
      <TextInput value={name} onChangeText={setName} placeholder="Display name" />
      <TextInput value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" />
      <Button title="Save" onPress={save} />
    </View>
  );
}
