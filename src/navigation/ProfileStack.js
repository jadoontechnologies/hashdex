import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import FriendsScreen from '../screens/Friends/FriendsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import PortfolioScreen from '../screens/Profile/PortfolioScreen';

const Stack = createNativeStackNavigator();
export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Friends" component={FriendsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
