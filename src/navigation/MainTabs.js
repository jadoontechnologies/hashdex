import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Existing stacks
import FeedStack from './FeedStack';
import CollectionsStack from './CollectionsStack';
import ProfileStack from './ProfileStack';

// Direct screens
import SearchScreen from '../screens/Search/SearchScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import BlockedUsersScreen from '../screens/Chat/BlockedUsersScreen.js';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="FeedTab" component={FeedStack} />
      <Tab.Screen name="CollectionsTab" component={CollectionsStack} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="ChatList" component={ChatListScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}
