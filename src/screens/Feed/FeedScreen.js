import React from 'react';
import { View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import FriendsFeedScreen from './FriendsFeedScreen';
import PublicFeedScreen from './PublicFeedScreen';
import PrivateFeedScreen from './PrivateFeedScreen';
import FloatingActionButton from '../../components/FloatingActionButton';

const Tab = createMaterialTopTabNavigator();

export default function FeedScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator>
        <Tab.Screen name="FriendsFeed" component={FriendsFeedScreen} options={{ title: 'Friends' }} />
        <Tab.Screen name="PublicFeed" component={PublicFeedScreen} options={{ title: 'Public' }} />
        <Tab.Screen name="PrivateFeed" component={PrivateFeedScreen} options={{ title: 'Private' }} />
      </Tab.Navigator>
      <FloatingActionButton onPress={() => navigation.navigate('Compose')} />
    </View>
  );
}
