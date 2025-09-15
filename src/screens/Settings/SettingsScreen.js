import React, { useContext, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { AuthContext } from '../../state/AuthContext';

export default function SettingsScreen(){
  const { profile } = useContext(AuthContext);
  const [push, setPush] = useState(true);
  return (
    <View style={{padding:16}}>
      <Text style={styles.h}>Settings</Text>
      <View style={styles.row}><Text>Push notifications</Text><Switch value={push} onValueChange={setPush} /></View>
      <Text style={{color:'#888', marginTop:10}}>More settings (privacy defaults, language, data export) — TODO</Text>
    </View>
  );
}
const styles = StyleSheet.create({ h:{ fontSize:22, fontWeight:'800', marginBottom:12 }, row:{ flexDirection:'row', justifyContent:'space-between', paddingVertical:10 }});
