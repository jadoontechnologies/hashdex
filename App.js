// App.js - FIXED VERSION
import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/state/AuthContext";
import * as Notifications from "expo-notifications";
import * as Font from "expo-font";
import { View, ActivityIndicator } from "react-native";

// ✅ Configure how notifications behave when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navigationRef = useRef();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        // FIX: Load Feather font explicitly for APK builds
        await Font.loadAsync({
          'Feather': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
        });
        console.log("✅ Feather icons font loaded successfully");
      } catch (e) {
        console.warn("Font loading error:", e);
      } finally {
        setReady(true);
      }
    }
    loadFonts();
  }, []);

  // ✅ Optional: notification listener for debugging
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notification received:", notification);
      }
    );
    return () => subscription.remove();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff7b72" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}