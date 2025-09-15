import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/Feed/FeedScreen';
import PostDetailScreen from '../screens/Feed/PostDetailScreen';
import ComposeScreen from '../screens/Feed/ComposeScreen';

const Stack = createNativeStackNavigator();
export default function FeedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Feed" component={FeedScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="Compose" component={ComposeScreen} options={{ title: 'New Post' }} />
    </Stack.Navigator>
  );
}
