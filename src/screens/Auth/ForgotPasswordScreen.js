import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const onReset = async () => {
    try { await sendPasswordResetEmail(auth, email.trim()); Alert.alert('Check your inbox', 'Password reset email sent.'); }
    catch(e){ Alert.alert('Error', e.message); }
  };
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Reset password</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <Button title="Send reset link" onPress={onReset} />
    </View>
  );
}
const styles = StyleSheet.create({ wrap:{flex:1,padding:16,justifyContent:'center'}, title:{fontSize:24, fontWeight:'700', marginBottom:12} });
