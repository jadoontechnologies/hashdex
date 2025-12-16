import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';

export default function FloatingActionButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.fab}><Text style={{color:'#fff', fontSize:24}}>＋</Text></TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  fab:{ position:'absolute', right:16, bottom:24, backgroundColor:'#ff6a3d', width:56, height:56, borderRadius:28, alignItems:'center', justifyContent:'center', elevation:3 }
});
