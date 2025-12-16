import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import { Feather, Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

export default function FontLoader({ children }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        console.log('🔄 Starting font loading...');
        // ✅ Load fonts directly from the vector icon objects
        await Font.loadAsync({
          ...Feather.font,
          ...Ionicons.font,
          ...MaterialIcons.font,
          ...FontAwesome.font,
        });
        console.log('✅ Fonts loaded successfully');
      } catch (error) {
        console.warn('❌ Error loading fonts:', error);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff7b72" />
      </View>
    );
  }

  return children;
}
