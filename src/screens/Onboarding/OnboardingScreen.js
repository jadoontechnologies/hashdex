import React, { useContext, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  useColorScheme,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/Button';
import { AuthContext } from '../../state/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const slides = [
  { key: '1', title: 'Create Collection', desc: 'Organize your items into collections', logo: '🗂️' },
  { key: '2', title: 'Assign Hashtag', desc: 'Tag your collections with relevant hashtags', logo: '🏷️' },
  { key: '3', title: 'Share Data', desc: 'Share your collections easily', logo: '🔗' },
  { key: '4', title: 'Share Hashtag', desc: 'Let others explore via hashtags', logo: '📣' },
  { key: '5', title: 'Friends', desc: 'Connect with friends', logo: '👥' },
  { key: '6', title: 'Chat', desc: 'Communicate with your network', logo: '💬' },
  { key: '7', title: 'Hashtag Index', desc: 'Discover trending hashtags', logo: '🔍' },
  { key: '8', title: 'Collections', desc: 'Browse collections easily', logo: '📚' },
  { key: '9', title: 'Done', desc: 'Start your journey!', logo: '🎉' },
];

export default function OnboardingScreen() {
  const { user, profile, setProfile } = useContext(AuthContext);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const finish = async () => {
    setErr(null);
    setSubmitting(true);
    try {
      if (!user?.uid) {
        navigation.replace('Auth');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), { firstRun: false });

      setProfile({ ...profile, firstRun: false });

    } catch (e) {
      setErr('Something went wrong. Please try again.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const theme = isDark ? dark : light;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finish();
    }
  };

  const handleSkip = () => {
    finish();
  };

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const viewConfigRef = { viewAreaCoveragePercentThreshold: 50 };

  const renderItem = ({ item }) => (
    <LinearGradient
      colors={['#F9F871', '#F28A47', '#DE5C76']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardContent}>
        <Text style={styles.slideLogo}>{item.logo}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.bullet}>{item.desc}</Text>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.wrap}>
        {/* Hero / Logo */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: theme.emphasisBg, borderColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.fg }]}>
            Welcome to <Text style={{ color: theme.accent }}>HashDex</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Your space to curate, organize, and share what matters.
          </Text>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfigRef}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 50 }}
        />

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: currentIndex === index ? theme.accent : theme.border },
              ]}
            />
          ))}
        </View>

        <View
          style={[
            styles.buttonRow,
            currentIndex === slides.length - 1 && { justifyContent: 'center' }, // center on last slide
          ]}
        >
          {currentIndex < slides.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={[styles.outlineBtn, { borderColor: theme.accent }]}>
              <Text style={{ color: theme.accent, fontWeight: '600' }}>Skip</Text>
            </TouchableOpacity>
          )}
          <Button
            title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
          />
        </View>

        {err ? <Text style={[styles.error, { color: theme.error }]}>{err}</Text> : null}

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
    paddingTop: 20,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  hero: { alignItems: 'center', marginTop: 20 },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  cardGradient: {
    borderRadius: 24,
    width: width * 0.75,
    height: 250,
    marginHorizontal: width * 0.075,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { alignItems: 'center' },
  slideLogo: { fontSize: 50, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#fff', textAlign: 'center' },
  bullet: { fontSize: 15, lineHeight: 22, color: '#fff', textAlign: 'center' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  outlineBtn: { paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderRadius: 12 },
  loading: { marginTop: 12 },
  error: { fontSize: 13, marginTop: 10, textAlign: 'center' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
