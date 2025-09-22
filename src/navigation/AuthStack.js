import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();
export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in', headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' , headerShown: false}} />
      <Stack.Screen name="Forgot" component={ForgotPasswordScreen} options={{ title: 'Reset password' , headerShown: false}} />
    </Stack.Navigator>
  );
}
