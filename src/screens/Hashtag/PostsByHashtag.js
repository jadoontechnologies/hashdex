// src/screens/Hashtag/PostsByHashtag.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import PostCard from "../../components/PostCard";
import Header from "../../components/Header";

// Helper to get Cloudinary URL
const getCloudinaryUrl = (path) =>
  path ? `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${path}` : null;

export default function PostsByHashtag({ route, navigation }) {
  const { tag, visibility } = route.params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

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

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            imageURL: getCloudinaryUrl(data.imagePath), // Cloudinary image
          };
        });
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
        <Text style={styles.errorText}>
          {error.includes("index") || error.includes("FAILED_PRECONDITION")
            ? "⚠️ Firestore index is still being built. Try again in a few minutes."
            : `Error: ${error}`}
        </Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#999" }}>No posts found for #{tag}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  errorText: { color: "red", fontSize: 16, textAlign: "center", padding: 10 },
});
