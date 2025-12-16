import React, { useContext, useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import OnboardingScreen from "../screens/Onboarding/OnboardingScreen";
import SplashScreen from "../screens/SplashScreen/SplashScreen";
import ReceiveShareScreen from "../screens/Feed/ReceiveShareScreen";
import ComposeScreen from "../screens/Feed/ComposeScreen";
import { AuthContext } from "../state/AuthContext";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, profile, loading } = useContext(AuthContext);
  const [showSplash, setShowSplash] = useState(true);

  // ✅ Show splash briefly on startup
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  const needsOnboarding = profile?.firstRun === true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ReceiveShare" component={ReceiveShareScreen} />
          <Stack.Screen name="Compose" component={ComposeScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
