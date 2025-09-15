import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Button({ title, onPress, variant='primary', disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, variant==='secondary' && styles.secondary, disabled && styles.disabled]}>
      <Text style={styles.txt}>{title}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  btn:{ backgroundColor:'#ff6a3d', padding:14, borderRadius:12, alignItems:'center', marginVertical:6},
  secondary:{ backgroundColor:'#222' },
  disabled:{ opacity:0.6 },
  txt:{ color:'#fff', fontWeight:'600' }
});
