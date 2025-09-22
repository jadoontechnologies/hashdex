// src/screens/Auth/RegisterScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput as RNTextInput,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db, now } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterScreen({ navigation }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);

  const fullName = useMemo(() => `${first.trim()} ${last.trim()}`.trim(), [first, last]);

  const register = async () => {
    try {
      if (!agree) return Alert.alert('Almost there', 'Please agree to the Terms to continue.');
      if (!first.trim() || !last.trim()) return Alert.alert('Name required', 'Please enter your first and last name.');
      if (pass.length < 6) return Alert.alert('Weak password', 'Password must be at least 6 characters.');
      if (pass !== confirm) return Alert.alert('Passwords do not match', 'Please confirm your password.');

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(cred.user, { displayName: fullName });

      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: fullName,
        photoURL: '',
        username: '',
        firstRun: true,
        joinedAt: now(),
        visibility: 'public',
        counters: { followers: 0, following: 0, posts: 0, collections: 0 },
      });

      // navigation && navigation.replace && navigation.replace('Home');
    } catch (e) {
      Alert.alert('Registration failed', e.message);
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
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Sign Up</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require('../../../assets/images/ic_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Form Inputs */}
          <UnderlineInput placeholder="First Name" value={first} onChangeText={setFirst} />
          <UnderlineInput placeholder="Last Name" value={last} onChangeText={setLast} />
          <UnderlineInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <UnderlineInput placeholder="Password" value={pass} onChangeText={setPass} secureTextEntry />
          <UnderlineInput placeholder="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry />

          {/* Terms */}
          <Pressable style={styles.termsRow} onPress={() => setAgree(!agree)}>
            <View style={[styles.checkbox, agree && styles.checkboxChecked]} />
            <Text style={styles.termsText}>
              By proceeding to create your account, you are agreeing to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Sign up button */}
          <Pressable onPress={register} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
            <Text style={styles.ctaText}>Sign up</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* Thin-underlined input */
function UnderlineInput(props) {
  return (
    <View style={styles.inputWrap}>
      <RNTextInput
        placeholderTextColor="rgba(255,255,255,0.9)"
        {...props}
        style={[styles.input, props.style]}
      />
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backArrow: {
    fontSize: 28,
    color: 'white',
    width: 30,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    paddingTop: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  logo: {
    width: 140,
    height: 80,
    alignSelf: 'center',
    marginVertical: 20,
    marginLeft: 30,
  },
  inputWrap: {
    marginTop: 18,
  },
  input: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
  },
  underline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 22,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: 'white',
  },
  termsText: {
    flex: 1,
    color: 'white',
    fontSize: 12.5,
    lineHeight: 18,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: 'white',
    fontWeight: '600',
  },
  cta: {
    marginTop: 28,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DE5C76',
  },
});
