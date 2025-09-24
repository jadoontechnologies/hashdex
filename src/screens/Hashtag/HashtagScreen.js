// src/components/Hashtag/HashtagScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function HashtagScreen({ navigation }) {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "hashtags"), orderBy("countPosts", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHashtags(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chip}
      onPress={() =>
        navigation.navigate("PostsByHashtag", { tag: item.id })
      }
    >
      <Text style={styles.text}>#{item.id} ({item.countPosts || 0})</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a3d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={hashtags}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  chip: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  text: { fontSize: 16, color: "#333" },
});
