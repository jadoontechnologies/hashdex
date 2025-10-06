import React, { useContext, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  Text,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../state/AuthContext";
import { follow, unfollow } from "../../services/social";
import { db } from "../../services/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import PostCard from "../../components/PostCard";
import { Menu, Provider } from "react-native-paper";
import { Share } from "react-native";

export default function ProfileScreen({ navigation, route }) {
  const { user, profile, signOut } = useContext(AuthContext);
  const targetId = route.params?.userId || user.uid;
  const viewingOwn = targetId === user.uid;

  const [otherProfile, setOtherProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [posts, setPosts] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [postViewMode, setPostViewMode] = useState("list");
  const [menuVisible, setMenuVisible] = useState(false);
  const [friends, setFriends] = useState([]);

  const data = viewingOwn ? profile : otherProfile;

  // Load other user profile & follow state
  useEffect(() => {
    if (!viewingOwn) {
      const unsubProfile = onSnapshot(doc(db, "users", targetId), (snap) => {
        if (snap.exists()) setOtherProfile({ id: snap.id, ...snap.data() });
      });
      const unsubFollow = onSnapshot(
        doc(db, "users", user.uid, "following", targetId),
        (snap) => setIsFollowing(snap.exists())
      );
      return () => {
        unsubProfile();
        unsubFollow();
      };
    }
  }, [targetId]);

  // Load friends list
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", targetId), (snap) => {
      if (snap.exists()) setFriends(snap.data().friends || []);
    });
    return unsub;
  }, [targetId]);

  // Load posts
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("author.id", "==", targetId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const allPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = allPosts.filter((post) => {
        if (!post.author || !post.author.id) return false;
        if (post.author.id === user.uid) return true;
        if (post.visibility === "public") return true;
        if (post.visibility === "friends" && friends.includes(user.uid))
          return true;
        return false;
      });
      setPosts(filtered);
    });

    return unsub;
  }, [targetId, user, friends]);

  // Load portfolio
  useEffect(() => {
    const unsubPortfolio = onSnapshot(
      collection(db, "users", targetId, "portfolio"),
      (snap) =>
        setPortfolio(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsubPortfolio;
  }, [targetId]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) await unfollow(user.uid, targetId);
      else if (otherProfile)
        await follow(user.uid, targetId, profile, otherProfile);
      else Alert.alert("Please wait", "Profile is still loading.");
    } catch {
      Alert.alert("Error", "Could not update follow state. Try again.");
    }
  };

  const PortfolioCard = ({ item }) => {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    return (
      <View style={styles.portfolioCard}>
        <Image
          source={{ uri: item.image || "https://placehold.co/600x400" }}
          style={styles.portfolioImage}
        />
        <Text style={styles.portfolioDesc}>{item.description}</Text>
        {item.link ? (
          <Text
            style={styles.portfolioLink}
            onPress={() => Linking.openURL(item.link)}
          >
            🔗 {item.link}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <Text>{liked ? "❤️ Liked" : "🤍 Like"}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text>💬 Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSaved(!saved)}>
            <Text>{saved ? "🔖 Saved" : "🔖 Save"}</Text>
          </TouchableOpacity>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Icon name="ellipsis-vertical" size={18} color="#555" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={async () => {
                setMenuVisible(false);
                try {
                  const message = `Check out this portfolio item:\n\n${item.description || ""
                    }\n${item.link ? item.link : ""}`;
                  await Share.share({ message });
                } catch (error) {
                  Alert.alert("Error", "Failed to share portfolio item");
                }
              }}
              title="Share"
              leadingIcon="share-variant"
            />

            {viewingOwn && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Portfolio", { editItem: item });
                }}
                title="Edit"
                leadingIcon="pencil"
              />
            )}
          </Menu>
        </View>
      </View>
    );
  };

  const Header = () => (
    <LinearGradient
      colors={["#F9F871", "#F28A47", "#DE5C76"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Icon name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={async () => {
              setMenuVisible(false);
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(
                    `https://yourapp.com/profile/${targetId}`
                  );
                } else {
                  Alert.alert("Sharing not available");
                }
              } catch (e) {
                console.log(e);
              }
            }}
            title="Share"
            leadingIcon="share-variant"
          />
          {viewingOwn && (
            <>
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  Alert.alert(
                    "Confirm Sign Out",
                    "Are you sure you want to sign out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Sign Out", style: "destructive", onPress: signOut },
                    ]
                  );
                }}
                title="Sign Out"
                leadingIcon="logout"
              />
            </>
          )}
        </Menu>
      </View>

      <View style={styles.topSection}>
        <Image
          source={{
            uri: data?.photoURL || "https://placehold.co/120x120",
          }}
          style={styles.avatar}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{data?.displayName || "User"}</Text>
          <Text style={styles.meta}>@{data?.username || "username"}</Text>

          {!viewingOwn && (
            <View style={styles.headerBtnRow}>
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={() =>
                  navigation.navigate("Chat", {
                    userId: targetId,
                    userName: data?.displayName || "User",
                    photoURL: data?.photoURL || "https://placehold.co/100x100",
                  })
                }
              >
                <Text style={{ color: "#ff6a3d", fontWeight: "600" }}>
                  Message
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.followBtn}
                onPress={toggleFollow}
              >
                <Text style={styles.followBtnText}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </LinearGradient >
  );

  const Tabs = () => (
    <View style={styles.tabs}>
      {["Posts", "Portfolio"].map((tab) => (
        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
          <Text style={activeTab === tab ? styles.activeTab : styles.tab}>
            {tab}
          </Text>
          {activeTab === tab && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const ViewToggle = () => {
    if (activeTab !== "Posts") return null;
    return (
      <View style={styles.viewToggle}>
        <TouchableOpacity
          onPress={() => setPostViewMode("list")}
          style={[
            styles.toggleBtn,
            postViewMode === "list" && styles.toggleBtnActive,
          ]}
        >
          <Icon
            name="list-outline"
            size={22}
            color={postViewMode === "list" ? "#fff" : "#555"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPostViewMode("grid")}
          style={[
            styles.toggleBtn,
            postViewMode === "grid" && styles.toggleBtnActive,
          ]}
        >
          <Icon
            name="grid-outline"
            size={22}
            color={postViewMode === "grid" ? "#fff" : "#555"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Provider>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <Header />
        <Tabs />
        <ViewToggle />
        <FlatList
          key={postViewMode}
          data={activeTab === "Posts" ? posts : portfolio}
          keyExtractor={(item) => item.id}
          numColumns={activeTab === "Posts" && postViewMode === "grid" ? 2 : 1}
          renderItem={({ item }) =>
            activeTab === "Posts" ? (
              postViewMode === "grid" ? (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() =>
                    navigation.navigate("PostDetail", { id: item.id })
                  }
                >
                  <Image
                    source={{
                      uri:
                        item.imageUrl ||
                        item.thumbnail ||
                        "https://placehold.co/300x300",
                    }}
                    style={styles.gridImage}
                  />
                </TouchableOpacity>
              ) : (
                <PostCard post={item} navigation={navigation} />
              )
            ) : (
              <PortfolioCard item={item} />
            )
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        {viewingOwn && activeTab === "Portfolio" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("Portfolio")}
          >
            <Icon name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  topSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  meta: { fontSize: 14, color: "#fff" },
  headerBtnRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  messageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ff6a3d",
  },
  followBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#ff6a3d",
  },
  followBtnText: { color: "#fff", fontWeight: "600" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
  },
  tab: { fontSize: 16, color: "#888", textAlign: "center" },
  activeTab: { fontSize: 16, fontWeight: "700", color: "#ff6a3d" },
  tabIndicator: { height: 2, backgroundColor: "#ff6a3d", marginTop: 4 },
  viewToggle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  toggleBtn: { padding: 8, borderRadius: 8, backgroundColor: "#eee" },
  toggleBtnActive: { backgroundColor: "#ff6a3d" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#ff6a3d",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  portfolioCard: {
    backgroundColor: "#fafafa",
    margin: 8,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  portfolioImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  portfolioDesc: { marginTop: 8, fontSize: 14, color: "#333" },
  portfolioLink: {
    marginTop: 6,
    color: "#1e90ff",
    textDecorationLine: "underline",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    marginTop: 8,
  },
});
