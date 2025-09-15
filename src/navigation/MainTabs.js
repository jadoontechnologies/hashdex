import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedStack from './FeedStack';
import CollectionsStack from './CollectionsStack';
import SearchScreen from '../screens/Search/SearchScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="FeedTab" component={FeedStack} options={{ title: 'Home' }} />
      <Tab.Screen name="CollectionsTab" component={CollectionsStack} options={{ title: 'Collections' }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}