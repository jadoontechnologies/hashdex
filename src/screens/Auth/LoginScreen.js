// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  TextInput as RNTextInput, Image, Pressable, SafeAreaView, StatusBar,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';

import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { auth } from '../../services/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Google AuthSession (Expo) ---
  const [googleReq, , googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '513308743657-6nrpgufn9i22me8abpql7oq730jn68r6.apps.googleusercontent.com',
  });
  

  // --- Facebook AuthSession (Expo) ---
  const [fbReq, , fbPromptAsync] = Facebook.useAuthRequest({
    clientId: 'YOUR_FACEBOOK_APP_ID',
    responseType: ResponseType.Token,
    scopes: ['public_profile', 'email'],
  });

  const login = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (e) {
      Alert.alert('Login failed', e.message);
    } finally { setLoading(false); }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const res = await googlePromptAsync({ useProxy: true });
      if (res.type === 'success') {
        const { id_token } = res.params;
        const cred = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, cred);
      }

    } catch (e) {
      Alert.alert('Google sign-in failed', e.message);
    } finally { setLoading(false); }
  };

  const loginWithFacebook = async () => {
    try {
      setLoading(true);
      const res = await fbPromptAsync({ useProxy: true });
      if (res.type !== 'success') return;

      const accessToken = res.params.access_token;
      const cred = FacebookAuthProvider.credential(accessToken);
      await signInWithCredential(auth, cred);
    } catch (e) {
      Alert.alert('Facebook sign-in failed', e.message);
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient
      colors={['#F9F871', '#F28A47', '#DE5C76']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
     
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoWrap}>
          <Image
                source={require('../../../assets/images/ic_logo.png')}
                style={styles.logo}
              />
          </View>

          {/* Inputs */}
          <UnderlineInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            leftIcon="👤"
          />
          <UnderlineInput
            placeholder="Password"
            secureTextEntry
            value={pass}
            onChangeText={setPass}
            leftIcon="🔒"
          />

          {/* Forgot */}
          <TouchableOpacity onPress={() => navigation.navigate('Forgot')} style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Primary button */}
          <Pressable onPress={login} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>{loading ? 'Logging in…' : 'Login'}</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.orWrap}>
            <View style={styles.hr} />
            <Text style={styles.orText}>Or Login with</Text>
            <View style={styles.hr} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            {/* <Pressable
              disabled={!fbReq}
              onPress={loginWithFacebook}
              style={[styles.circleBtn, !fbReq && { opacity: 0.6 }]}
            >
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Facebook_icon_2013.svg' }}
                style={styles.circleLogo}
              />
            </Pressable> */}

            <Pressable
              disabled={!googleReq}
              onPress={loginWithGoogle}
              style={[styles.circleBtn, !googleReq && { opacity: 0.6 }]}
            >
              <Image
                source={require('../../../assets/images/google.png')}
                style={styles.circleLogo}
              />
            </Pressable>
          </View>

          {/* Sign up */}
          <Text style={styles.bottomText}>
            Don’t have an account?{' '}
            <Text style={styles.bottomLink} onPress={() => navigation.navigate('Register')}>
              Sign up
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function UnderlineInput({ leftIcon, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputRow}>
        {leftIcon ? <Text style={styles.leftIcon}>{leftIcon}</Text> : null}
        <RNTextInput
          placeholderTextColor="rgba(255,255,255,0.9)"
          {...props}
          style={[styles.input, props.style]}
        />
      </View>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 18 },
  logoWrap: { alignItems: 'center', marginTop: 12, marginBottom: 24 , width: 360, height: 140,  justifyContent: 'center' },
  logo: { width: 160, height: 90 },
  inputWrap: { marginTop: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  leftIcon: { color: 'white', fontSize: 16, marginRight: 8 },
  input: { color: 'white', fontSize: 16, paddingVertical: 8, flex: 1 },
  underline: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.85)' },
  forgotWrap: { alignItems: 'flex-end', marginTop: 10 },
  forgot: { color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },
  cta: {
    marginTop: 18, backgroundColor: 'white', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
  },
  ctaText: { color: '#C84C70', fontWeight: '700', fontSize: 16 },
  orWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 28 },
  hr: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.6)' },
  orText: { marginHorizontal: 10, color: 'white' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 18 },
  circleBtn: {
    width: 66, height: 66, borderRadius: 33, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
  },
  circleLogo: { width: 36, height: 36 },
  bottomText: { textAlign: 'center', color: 'white', marginTop: 28 },
  bottomLink: { color: 'white', textDecorationLine: 'underline', fontWeight: '600' },
});
