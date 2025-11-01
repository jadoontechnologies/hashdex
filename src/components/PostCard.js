// src/components/PostCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import MediaCarousel from "./MediaCarousel";

export default function PostCard({ post, onPress }) {
  // 🔹 Safe data extraction with fallbacks
  const authorPhoto =
    post?.authorPhoto ||
    post?.author?.photoURL ||
    "https://placehold.co/100x100/eee/ccc?text=User";
  const authorName =
    post?.authorName || post?.author?.displayName || "Anonymous User";
  const visibility = post?.visibility || "public";
  const postText = post?.text || "";

  // 🔹 Handle media array (Cloudinary URLs)
  const media =
    post?.media ||
    post?.attachments?.map((a) => a.url) ||
    (post?.image ? [post.image] : []);

  const likes = post?.stats?.likes || post?.likesCount || 0;
  const comments = post?.stats?.comments || post?.commentsCount || 0;
  const saves = post?.stats?.saves || post?.savesCount || 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: authorPhoto }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {authorName}
          </Text>
          <Text style={styles.meta}>
            {visibility.toUpperCase()} •{" "}
            {post?.createdAt?.toDate?.().toLocaleDateString() || "Recently"}
          </Text>
        </View>
      </View>

      {/* Post Text */}
      {postText.length > 0 && (
        <Text style={styles.text} numberOfLines={3}>
          {postText}
        </Text>
      )}

      {/* Media Carousel */}
      {media?.length > 0 && <MediaCarousel media={media} />}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>❤️</Text>
          <Text style={styles.footerText}>{likes}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>💬</Text>
          <Text style={styles.footerText}>{comments}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerIcon}>🔖</Text>
          <Text style={styles.footerText}>{saves}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  meta: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  text: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 15,
    lineHeight: 20,
    color: "#444",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});
