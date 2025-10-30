import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

const { height: screenHeight } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return Alert.alert('Email required', 'Please enter your email.');
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Success', 'Password reset link sent to your email.');
      setEmail('');
    } catch (e) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <LinearGradient
        colors={['#F9F871', '#F28A47', '#DE5C76']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </LinearGradient>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo */}
        <Image
          source={require('../../../assets/images/forgot.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Email Box with icon */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <Text style={styles.icon}>📧</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="rgba(0,0,0,0.5)"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Full width button at bottom */}
      <LinearGradient
        colors={['#F9F871', '#F28A47', '#DE5C76']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaContainer}
      >
        <Pressable
          onPress={handleReset}
          style={{ width: '100%', alignItems: 'center', paddingVertical: 16 }}
        >
          <Text style={styles.ctaText}>{loading ? 'Sending…' : 'Reset Password'}</Text>
        </Pressable>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backArrow: {
    fontSize: 28,
    color: 'white',
    width: 30,
    marginTop: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginRight: 30,
    marginTop: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 20,
    justifyContent: 'flex-start',
  },
  logo: {
    width: '60%',
    height: screenHeight * 0.25,
    alignSelf: 'center',
    marginTop: 75,
    marginBottom: 50,
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  ctaContainer: {
    width: '100%',
    borderRadius: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
