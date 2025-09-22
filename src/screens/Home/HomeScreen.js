import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import FriendsFeedScreen from '../Feed/FriendsFeedScreen';
import PublicFeedScreen from '../Feed/PublicFeedScreen';
import PrivateFeedScreen from '../Feed/PrivateFeedScreen';
import FloatingMenu from './FloatingMenu';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* HEADER + GRADIENT */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.heroArea}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
            <Text style={styles.headerButton}>💬</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Home</Text>

          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.headerButton}>🔔</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* SEARCH BAR */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search posts..."
        placeholderTextColor="#999"
      />

      {/* TAB NAVIGATOR - FULL HEIGHT */}
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: { color: '#ff7b72', fontWeight: 'bold' },
            tabBarIndicatorStyle: { backgroundColor: '#ff7b72' },
            tabBarStyle: {
              backgroundColor: '#fff',
              elevation: 0
            },
          }}
        >
          <Tab.Screen name="FriendsFeed" component={FriendsFeedScreen} options={{ title: 'Friends' }} />
          <Tab.Screen name="PublicFeed" component={PublicFeedScreen} options={{ title: 'Public' }} />
          <Tab.Screen name="PrivateFeed" component={PrivateFeedScreen} options={{ title: 'Private' }} />
        </Tab.Navigator>
      </View>

      {/* ADS BANNER */}
      <View style={styles.adBanner}>
        <Text>Sponsored Ad</Text>
      </View>

      {/* FLOATING LEFT BUTTON (#) */}
      <TouchableOpacity
        style={[styles.fab, styles.leftFab]}
        onPress={() => navigation.navigate('Hashtage')}
      >
        <Text style={styles.fabText}>#</Text>
      </TouchableOpacity>

      {/* FLOATING MENU BUTTON */}
      <FloatingMenu navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  heroArea: {
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden'
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8
  },

  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerButton: { fontSize: 22, color: '#fff' },

  searchBar: {
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },

  adBanner: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderTopWidth: 1,
    borderColor: '#ddd'
  },

  fab: {
    position: 'absolute',
    bottom: 60,
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#ff7b72',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  },

  fabText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  leftFab: { left: 20, bottom: 70 }
});
