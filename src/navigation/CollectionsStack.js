import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CollectionsListScreen from '../screens/Collections/CollectionsListScreen';
import CreateCollectionScreen from '../screens/Collections/CreateCollectionScreen';
import CollectionDetailScreen from '../screens/Collections/CollectionDetailScreen';
import EditCollectionScreen from '../screens/Collections/EditCollectionScreen';

const Stack = createNativeStackNavigator();
export default function CollectionsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Collections" component={CollectionsListScreen} />
      <Stack.Screen name="CreateCollection" component={CreateCollectionScreen} options={{ title: 'New Collection' }} />
      <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ title: 'Collection' }} />
      <Stack.Screen name="EditCollection" component={EditCollectionScreen} options={{ title: 'Edit Collection' }} />
    </Stack.Navigator>
  );
}
