import React, { useContext, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/Button';
import { AuthContext } from '../../state/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function OnboardingScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const finish = async () => {
    setErr(null);
    setSubmitting(true);
    try {
      // If we don't have a user (e.g., logged out), just go to Login.
      if (!user?.uid) {
        navigation.navigate('Login');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), { firstRun: false });

      // Replace so onboarding isn't in the back stack.
      navigation.replace('Auth');
    } catch (e) {
      setErr('Something went wrong. Please try again.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const theme = isDark ? dark : light;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.wrap}>
        {/* Hero / Logo */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: theme.emphasisBg, borderColor: theme.border }]}>
            {/* Replace with your actual logo asset if you have one */}
            {/* <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            /> */}
          </View>
          <Text style={[styles.title, { color: theme.fg }]}>
            Welcome to <Text style={{ color: theme.accent }}>HashDex</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Your space to curate, organize, and share what matters.
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.fg }]}>
            What you can do
          </Text>
          <View style={styles.bullets}>
            <Text style={[styles.bullet, { color: theme.fg }]}>✨ Build a rich profile that reflects you</Text>
            <Text style={[styles.bullet, { color: theme.fg }]}>📚 Create collections for any topic</Text>
            <Text style={[styles.bullet, { color: theme.fg }]}>🔗 Share publicly, privately, or with friends</Text>
          </View>

          <Text style={[styles.helper, { color: theme.muted }]}>
            You can change these anytime in Settings.
          </Text>

          <Button
            title={submitting ? 'Please wait…' : 'Get Started'}
            onPress={finish}
            disabled={submitting}
          />

          {submitting && (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          )}

          {err ? <Text style={[styles.error, { color: theme.error }]}>{err}</Text> : null}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.muted }]}>
          By continuing, you agree to our Terms & Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const light = {
  bg: '#F7F7F8',
  cardBg: '#FFFFFF',
  fg: '#0B0B0F',
  muted: '#6B7280',
  accent: '#6C5CE7',
  border: '#E5E7EB',
  emphasisBg: '#EEF2FF',
  shadow: '#000',
  error: '#DC2626',
};

const dark = {
  bg: '#0B0B0F',
  cardBg: '#12131A',
  fg: '#F2F3F5',
  muted: '#A3A8B3',
  accent: '#8B7CFF',
  border: '#1F2430',
  emphasisBg: '#171A24',
  shadow: '#000',
  error: '#F87171',
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  hero: { alignItems: 'center', marginTop: 24 },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: { width: 48, height: 48 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  bullets: { gap: 6, marginBottom: 14 },
  bullet: { fontSize: 15, lineHeight: 22 },
  helper: { fontSize: 12, marginBottom: 14 },
  loading: { marginTop: 12 },
  error: { fontSize: 13, marginTop: 10 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
