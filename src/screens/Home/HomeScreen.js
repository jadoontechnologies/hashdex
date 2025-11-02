import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, StatusBar } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import FriendsFeedScreen from "../Feed/FriendsFeedScreen";
import PublicFeedScreen from "../Feed/PublicFeedScreen";
import PrivateFeedScreen from "../Feed/PrivateFeedScreen";
import FloatingMenu from "./FloatingMenu";

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // 🔔 Real-time unread notifications
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => setHasUnreadNotif(!snap.empty));
    return () => unsub();
  }, [user]);

  // 💬 Real-time unread chat messages
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const hasUnread = snap.docs.some(
        (d) => Array.isArray(d.data()?.unreadBy) && d.data().unreadBy.includes(user.uid)
      );
      setHasUnreadChat(hasUnread);
    });

    return () => unsub();
  }, [user]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.heroArea, { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 35 }]}
      >
        <View style={styles.header}>
          {/* Chat icon + dot */}
          <View>
            <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
              <Feather name="message-circle" size={26} color="#fff" />
            </TouchableOpacity>
            {hasUnreadChat && <View style={styles.chatDot} />}
          </View>

          <Text style={styles.headerTitle}>Home</Text>

          {/* Notification icon + dot */}
          <View>
            <TouchableOpacity onPress={() => navigation.navigate("Alerts")}>
              <Feather name="bell" size={26} color="#fff" />
            </TouchableOpacity>
            {hasUnreadNotif && <View style={styles.dot} />}
          </View>
        </View>
      </LinearGradient>

      {/* SEARCH BAR */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search posts..."
        placeholderTextColor="#999"
      />

      {/* FEED TABS */}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: { color: "#ff7b72", fontWeight: "bold" },
            tabBarIndicatorStyle: { backgroundColor: "#ff7b72" },
            tabBarStyle: { backgroundColor: "#fff", elevation: 0 },
          }}
        >
          <Tab.Screen
            name="PublicFeed"
            component={PublicFeedScreen}
            options={{ title: "Public" }}
          />
          <Tab.Screen
            name="FriendsFeed"
            component={FriendsFeedScreen}
            options={{ title: "Friends" }}
          />
          <Tab.Screen
            name="PrivateFeed"
            component={PrivateFeedScreen}
            options={{ title: "Private" }}
          />
        </Tab.Navigator>
      </View>

      {/* ADS BANNER */}
      <View style={styles.adBanner}>
        <Text>Sponsored Ad</Text>
      </View>

      {/* FLOATING BUTTONS */}
      <TouchableOpacity
        style={[styles.fab, styles.leftFab]}
        onPress={() => navigation.navigate("Hashtag")}
      >
        <Feather name="hash" size={22} color="#fff" />
      </TouchableOpacity>

      <FloatingMenu navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  heroArea: {
    paddingBottom: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  dot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },
  chatDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "limegreen",
  },
  searchBar: {
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    flexShrink: 1,
  },
  adBanner: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  fab: {
    position: "absolute",
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#ff7b72",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  leftFab: { left: 20, bottom: 110 }, // pushed above adBanner
});
