import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput as RNTextInput,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
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

  // Google Auth
  const [googleReq, , googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '513308743657-6nrpgufn9i22me8abpql7oq730jn68r6.apps.googleusercontent.com',
  });

  // Facebook Auth
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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F9F871', '#F28A47', '#DE5C76']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../assets/images/ic_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Inputs */}
          <UnderlineInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Feather name="user" size={18} color="white" />}
          />
          <UnderlineInput
            placeholder="Password"
            secureTextEntry
            value={pass}
            onChangeText={setPass}
            leftIcon={<Feather name="lock" size={18} color="white" />}
          />

          {/* Forgot */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Forgot')}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Primary button */}
          <Pressable
            onPress={login}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.ctaText}>{loading ? 'Logging in…' : 'Login'}</Text>
          </Pressable>

          {/* Sign up */}
          <Text style={styles.bottomText}>
            Don’t have an account?{' '}
            <Text
              style={styles.bottomLink}
              onPress={() => navigation.navigate('Register')}
            >
              Sign up
            </Text>
          </Text>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <Pressable
              disabled={!fbReq}
              onPress={loginWithFacebook}
              style={[styles.circleBtn, !fbReq && { opacity: 0.6 }]}
            >
              <Image
                source={require('../../../assets/images/fb.png')}
                style={styles.fbLogo}
              />
            </Pressable>

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
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* Custom Underline Input with Eye Toggle */
function UnderlineInput({ leftIcon, secureTextEntry, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputRow}>
        {/* handle icon or text safely */}
        {leftIcon ? (
          typeof leftIcon === 'string' ? (
            <Text style={styles.leftIcon}>{leftIcon}</Text>
          ) : (
            <View style={styles.leftIcon}>{leftIcon}</View>
          )
        ) : null}

        <RNTextInput
          placeholderTextColor="rgba(255,255,255,0.9)"
          {...props}
          secureTextEntry={secureTextEntry && !show}
          style={[styles.input, props.style]}
        />

        {secureTextEntry && (
          <Pressable onPress={() => setShow(!show)} style={styles.eyeIcon}>
            <Feather name={show ? 'eye-off' : 'eye'} size={18} color="white" />
          </Pressable>
        )}
      </View>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  logoWrap: { alignItems: 'center', marginBottom: 70 },
  logo: { width: 160, height: 90 },
  inputWrap: { marginTop: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  leftIcon: { marginRight: 8 },
  input: { color: 'white', fontSize: 16, paddingVertical: 8, flex: 1 },
  eyeIcon: { paddingHorizontal: 6 },
  underline: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.85)' },
  forgotWrap: { alignItems: 'flex-end', marginTop: 10 },
  forgot: { color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },
  cta: {
    marginTop: 18,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  ctaText: { color: '#C84C70', fontWeight: '700', fontSize: 16 },
  bottomText: { textAlign: 'center', color: 'white', marginTop: 18 },
  bottomLink: { color: 'white', textDecorationLine: 'underline', fontWeight: '600' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 40 },
  circleBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLogo: { width: 65, height: 65 },
  fbLogo: { width: 95, height: 95 },
});
