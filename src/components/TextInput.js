import React from 'react';
import { TextInput as RNInput, StyleSheet, View } from 'react-native';

export default function TextInput({ style, ...rest }) {
  return (
    <View style={styles.wrap}>
      <RNInput placeholderTextColor="#999" style={[styles.input, style]} {...rest} />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ borderWidth:1, borderColor:'#eee', borderRadius:10, marginVertical:6, backgroundColor:'#fff' },
  input:{ padding:12, fontSize:16 }
});
