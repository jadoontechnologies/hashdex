import React, { useContext, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { AuthContext } from '../state/AuthContext';
import SplashScreen from '../screens/SplashScreen/SplashScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, profile, loading } = useContext(AuthContext);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) return <SplashScreen />;

  // DEV: force onboarding for testing
  const forceOnboarding = false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : forceOnboarding || profile?.firstRun === true ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        // ✅ Use MainTabs here instead of FeedStack
        <Stack.Screen name="Home" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
