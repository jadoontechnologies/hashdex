import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import PostCard from "../../components/PostCard";
import Header from "../../components/Header"; // ✅ Reusable Header

export default function PostsByHashtag({ route, navigation }) {
  const { tag, visibility } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = query(
      collection(db, "posts"),
      where("hashtags", "array-contains", tag),
      orderBy("createdAt", "desc")
    );

    if (visibility) {
      q = query(
        collection(db, "posts"),
        where("hashtags", "array-contains", tag),
        where("visibility", "==", visibility),
        orderBy("createdAt", "desc")
      );
    }

    try {
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setPosts(list);
          setLoading(false);
        },
        (err) => {
          console.error("Firestore query error:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Query setup failed:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [tag, visibility]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6a3d" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text
          style={{
            color: "red",
            fontSize: 16,
            textAlign: "center",
            padding: 10,
          }}
        >
          {error.includes("index") || error.includes("FAILED_PRECONDITION")
            ? "⚠️ Firestore index is still being built for this query.\nPlease try again in a few minutes."
            : `Error: ${error}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Reusable header - back button handled automatically */}
      <Header title={`#${tag}`} />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              navigation.navigate("FeedTab", {
                screen: "PostDetail",
                params: { id: item.id },
              })
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
