import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Existing stacks
import FeedStack from './FeedStack';
import CollectionsStack from './CollectionsStack';
import ProfileStack from './ProfileStack';

// Direct screens (not in stack)
import SearchScreen from '../screens/Search/SearchScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import HashtageScreen from '../screens/Hashtag/HashtagScreen';
import ChatScreen from '../screens/Chat/ChatScreen';

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
      <Tab.Screen name="Hashtage" component={HashtageScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>

  );
}
