import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OPTIONS = ['private','friends','public'];

export default function PrivacyPicker({ value='friends', onChange }) {
  const [v, setV] = useState(value);
  const select = (opt) => { setV(opt); onChange?.(opt); };
  return (
    <View style={styles.row}>
      {OPTIONS.map(opt => (
        <TouchableOpacity key={opt} style={[styles.pill, v===opt && styles.active]} onPress={() => select(opt)}>
          <Text style={[styles.txt, v===opt && styles.activeTxt]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row:{ flexDirection:'row', gap:8 },
  pill:{ paddingVertical:6, paddingHorizontal:10, borderRadius:16, borderWidth:1, borderColor:'#ddd' },
  active:{ backgroundColor:'#ff6a3d', borderColor:'#ff6a3d' },
  txt:{ color:'#333', fontSize:12, textTransform:'capitalize' },
  activeTxt:{ color:'#fff' }
});
