// src/screens/ProfileScreen.js
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  FlatList,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  Share,
  Linking,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Menu, Provider } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

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

// ✅ Shared Components
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import PostCard from "../../components/PostCard";
import EmptyState from "../../components/EmptyState";

export default function ProfileScreen({ navigation, route }) {
  const { user, profile, signOut } = useContext(AuthContext);
  const targetId = route.params?.userId || user.uid;
  const viewingOwn = targetId === user.uid;

  const [otherProfile, setOtherProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  const [posts, setPosts] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const data = viewingOwn ? profile : otherProfile;

  // Load profile + follow state
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

  // Load friends
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
      (snap) => setPortfolio(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsubPortfolio;
  }, [targetId]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) await unfollow(user.uid, targetId);
      else if (otherProfile) await follow(user.uid, targetId, profile, otherProfile);
      else Alert.alert("Please wait", "Profile is still loading.");
    } catch {
      Alert.alert("Error", "Could not update follow state. Try again.");
    }
  };

  // ---------------- PDF HANDLING ----------------
  const handleOpenPDF = async (uri) => {
    try {
      setLoadingPdf(true);
      const fileName = uri.split("/").pop();
      const cachePath = FileSystem.cacheDirectory + fileName;
      const download = await FileSystem.downloadAsync(uri, cachePath);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(download.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Open PDF with...",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Error", "Sharing not available on this device");
      }
    } catch (err) {
      console.error("PDF open error:", err);
      Alert.alert("Error", "Could not open PDF.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadPDF = async (uri) => {
    try {
      setLoadingPdf(true);

      if (Platform.OS === "android") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please allow storage access to save PDF"
          );
          setLoadingPdf(false);
          return;
        }
      }

      const fileName = uri.split("/").pop();
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.downloadAsync(uri, filePath);

      if (Platform.OS === "android") {
        const asset = await MediaLibrary.createAssetAsync(filePath);
        let album = await MediaLibrary.getAlbumAsync("Download");
        if (album) await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        else await MediaLibrary.createAlbumAsync("Download", asset, false);
      }

      Alert.alert("✅ Saved", `PDF saved to your device: ${fileName}`);
    } catch (err) {
      console.error("Download PDF error:", err);
      Alert.alert("Error", "Could not save PDF.");
    } finally {
      setLoadingPdf(false);
    }
  };

  // ---------------- PORTFOLIO CARD ----------------
  const PortfolioCard = ({ item }) => {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const isPdf = item.image?.endsWith(".pdf") || item.mimeType?.includes("pdf");

    return (
      <View style={styles.portfolioCard}>
        {isPdf ? (
          <TouchableOpacity
            style={{
              height: 180,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f1f1f1",
              borderRadius: 8,
            }}
            onPress={() =>
              Alert.alert("PDF Options", item.description || "PDF Document", [
                { text: "Cancel", style: "cancel" },
                { text: "Open", onPress: () => handleOpenPDF(item.image) },
                { text: "Download", onPress: () => handleDownloadPDF(item.image) },
              ])
            }
          >
            <Text style={{ fontSize: 16, color: "#333" }}>
              📄 {item.image.split("/").pop()}
            </Text>
            {loadingPdf && <ActivityIndicator style={{ marginTop: 10 }} />}
          </TouchableOpacity>
        ) : (
          <Image
            source={{ uri: item.image || "https://placehold.co/600x400" }}
            style={styles.portfolioImage}
          />
        )}

        <Text style={styles.portfolioDesc}>{item.description}</Text>
        {item.link && (
          <Text
            style={styles.portfolioLink}
            onPress={() => {
              try {
                Linking.openURL(item.link);
              } catch {
                Alert.alert("Error", "Cannot open link");
              }
            }}
          >
            🔗 {item.link}
          </Text>
        )}

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
                <Image
                  source={require("../../../assets/icons/more-dots.png")}
                  style={{ width: 18, height: 18 }}
                />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={async () => {
                setMenuVisible(false);
                try {
                  await Share.share({
                    message: `Check out this portfolio item:\n\n${item.description || ""}\n${item.link || ""}`,
                  });
                } catch {
                  Alert.alert("Error", "Failed to share portfolio item");
                }
              }}
              title="Share"
            />

            {viewingOwn && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Portfolio", { editItem: item });
                }}
                title="Edit"
              />
            )}
          </Menu>
        </View>
      </View>
    );
  };

  // ---------------- PROFILE HEADER ----------------
  const ProfileHeader = () => (
    <LinearGradient
      colors={["#F9F871", "#F28A47", "#DE5C76"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerTopRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require("../../../assets/icons/back.png")}
            style={{ width: 28, height: 28 }}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Image
                source={require("../../../assets/icons/more-dots.png")}
                style={{ width: 22, height: 22 }}
              />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={async () => {
              setMenuVisible(false);
              try {
                await Share.share({
                  message: `Check out this profile: https://yourapp.com/profile/${targetId}`,
                });
              } catch (e) {
                console.log(e);
              }
            }}
            title="Share"
          />
          {viewingOwn && (
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
            />
          )}
        </Menu>
      </View>

      <View style={styles.topSection}>
        <Avatar uri={data?.photoURL} size={90} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{data?.displayName || "User"}</Text>
          <Text style={styles.meta}>@{data?.username || "username"}</Text>

          {!viewingOwn && (
            <View style={styles.headerBtnRow}>
              <Button
                title="Message"
                variant="outline"
                onPress={() =>
                  navigation.navigate("Chat", {
                    userId: targetId,
                    userName: data?.displayName || "User",
                    photoURL: data?.photoURL,
                  })
                }
              />
              <Button title={isFollowing ? "Unfollow" : "Follow"} onPress={toggleFollow} />
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  const Tabs = () => (
    <View style={styles.tabs}>
      {["Posts", "Portfolio"].map((tab) => (
        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
          <Text style={activeTab === tab ? styles.activeTab : styles.tab}>{tab}</Text>
          {activeTab === tab && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Provider>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <ProfileHeader />
        <Tabs />

        <FlatList
          data={activeTab === "Posts" ? posts : portfolio}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            activeTab === "Posts" ? (
              <PostCard
                post={item}
                onPress={() => {
                  navigation.navigate("FeedTab", {
                    screen: "PostDetail",
                    params: { id: item.id },
                  });
                }}
              />
            ) : (
              <PortfolioCard item={item} />
            )
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <EmptyState
              title={`No ${activeTab.toLowerCase()} yet`}
              message={
                viewingOwn
                  ? `You haven't added any ${activeTab.toLowerCase()} yet.`
                  : `${data?.displayName || "This user"} has no ${activeTab.toLowerCase()} yet.`
              }
            />
          }
        />

        {viewingOwn && activeTab === "Portfolio" && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate("Portfolio")}
          >
            <Image
              source={require("../../../assets/icons/add.png")}
              style={{ width: 28, height: 28 }}
            />
          </TouchableOpacity>
        )}

        {loadingPdf && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
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
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  topSection: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  meta: { fontSize: 14, color: "#fff" },
  headerBtnRow: { flexDirection: "row", marginTop: 8, gap: 8 },
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
