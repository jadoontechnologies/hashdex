import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { AuthContext } from '../state/AuthContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, profile, loading } = useContext(AuthContext);

  if (loading) return null; // add a splash later

  const needsOnboarding = user && profile && profile.firstRun === true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
