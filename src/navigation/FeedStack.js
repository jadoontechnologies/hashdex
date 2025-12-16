import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/Home/HomeScreen";
import PostDetailScreen from "../screens/Feed/PostDetailScreen";
import ComposeScreen from "../screens/Feed/ComposeScreen";
import FloatingMenu from "../screens/Home/FloatingMenu";
import HashtagScreen from "../screens/Hashtag/HashtagScreen";
import PostsByHashtag from "../screens/Hashtag/PostsByHashtag";

const Stack = createNativeStackNavigator();

export default function FeedStack() {
  return (
    <Stack.Navigator
      initialRouteName="FeedHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="FeedHome" component={HomeScreen} />
      <Stack.Screen name="Hashtag" component={HashtagScreen} />
      <Stack.Screen name="PostsByHashtag" component={PostsByHashtag} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="Compose" component={ComposeScreen} />
      <Stack.Screen name="FloatingMenu" component={FloatingMenu} />
    </Stack.Navigator>
  );
}
