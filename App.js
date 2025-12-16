// App.js
import React, { createRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/state/AuthContext";
import ShareHandlerWrapper from "./src/components/ShareHandlerWrapper";
import * as Notifications from "expo-notifications";

export const navigationRef = createRef();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <ShareHandlerWrapper>
          <RootNavigator />
        </ShareHandlerWrapper>
      </NavigationContainer>
    </AuthProvider>
  );
}
