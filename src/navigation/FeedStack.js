import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import FloatingMenu from '../screens/Home/FloatingMenu';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import PostDetailScreen from '../screens/Feed/PostDetailScreen';
import ComposeScreen from '../screens/Feed/ComposeScreen';

const Stack = createNativeStackNavigator();

export default function FeedStack() {
  return (
    <Stack.Navigator>
      {/* Use HomeScreen as main entry */}
      <Stack.Screen name="Feed" component={HomeScreen} options={{ title: 'Home', headerShown: false }}/>
      
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="Compose" component={ComposeScreen} options={{ title: 'New Post', headerShown: false }} />
      <Stack.Screen name="FloatingMenu" component={FloatingMenu} options={{ title: 'Menu' }} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
