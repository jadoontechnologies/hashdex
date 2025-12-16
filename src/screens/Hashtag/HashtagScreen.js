// src/screens/Hashtag/HashtagScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import Header from "../../components/Header";
import { AuthContext } from "../../state/AuthContext";

const Tab = createMaterialTopTabNavigator();

function HashtagTab({ navigation, visibility, search }) {
  const { user } = useContext(AuthContext);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let postsQuery;

    if (visibility === "private") {
      // Only my private posts
      postsQuery = query(
        collection(db, "posts"),
        where("visibility", "==", "private"),
        where("author.id", "==", user.uid)
      );
    } else if (visibility === "friends") {
      // Only posts visible to friends
      postsQuery = query(
        collection(db, "posts"),
        where("visibility", "==", "friends")
      );
    } else {
      // Public posts
      postsQuery = query(
        collection(db, "posts"),
        where("visibility", "==", "public")
      );
    }

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const tagsSet = new Set();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.hashtags)) {
            data.hashtags.forEach((h) => tagsSet.add(h.toLowerCase().trim()));
          }
        });

        const sortedTags = Array.from(tagsSet)
          .filter((t) => t.length > 0)
          .sort((a, b) => a.localeCompare(b));

        const grouped = sortedTags.reduce((acc, tag) => {
          const letter = tag[0].toUpperCase();
          if (!acc[letter]) acc[letter] = [];
          acc[letter].push({ id: tag });
          return acc;
        }, {});

        const formattedSections = Object.keys(grouped)
          .sort()
          .map((letter) => ({ title: letter, data: grouped[letter] }));

        setSections(formattedSections);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching hashtags:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [visibility, user]);

  const filteredSections = sections
    .map((section) => ({
      ...section,
      data: section.data.filter((item) =>
        item.id.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((section) => section.data.length > 0);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a3d" />
      </View>
    );

  if (filteredSections.length === 0)
    return (
      <View style={styles.center}>
        <Text style={{ color: "#999" }}>No hashtags found</Text>
      </View>
    );

  return (
    <SectionList
      sections={filteredSections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.chip}
          onPress={() =>
            navigation.navigate("PostsByHashtag", {
              tag: item.id,
              visibility,
            })
          }
        >
          <Text style={styles.text}>#{item.id}</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ padding: 12 }}
      stickySectionHeadersEnabled
    />
  );
}

export default function HashtagScreen({ navigation }) {
  const [search, setSearch] = useState("");

  return (
    <View style={styles.container}>
      <Header title="Hashtags" />

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search hashtags..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { color: "#ff6a3d", fontWeight: "600" },
          tabBarIndicatorStyle: { backgroundColor: "#ff6a3d", height: 3 },
          tabBarStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            borderBottomWidth: 1,
            borderColor: "#eee",
          },
        }}
      >
        <Tab.Screen name="Public">
          {() => <HashtagTab navigation={navigation} visibility="public" search={search} />}
        </Tab.Screen>
        <Tab.Screen name="Friends">
          {() => <HashtagTab navigation={navigation} visibility="friends" search={search} />}
        </Tab.Screen>
        <Tab.Screen name="Private">
          {() => <HashtagTab navigation={navigation} visibility="private" search={search} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  searchBar: {
    backgroundColor: "#f9f9f9",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  chip: {
    backgroundColor: "#f4f4f4",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    marginVertical: 5,
  },
  text: { fontSize: 16, color: "#333" },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ff6a3d",
    marginTop: 15,
    marginBottom: 6,
    paddingHorizontal: 5,
  },
});
