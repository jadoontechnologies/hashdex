import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { Menu, Provider } from "react-native-paper";
import { AuthContext } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { follow, unfollow } from "../../services/social";
import colors from "../../theme/colors";

const TABS = ["Search", "Following", "Followers"];

export default function FriendsScreen({ navigation }) {
  const { user, profile } = useContext(AuthContext);
  const [tab, setTab] = useState("Search");
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [followingMap, setFollowingMap] = useState({});
  const [menuVisible, setMenuVisible] = useState(null);

  // Fetch following map
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "following"),
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = true;
        });
        setFollowingMap(map);
      }
    );
    return () => unsub();
  }, [user]);

  // Fetch friends based on tab
  useEffect(() => {
    if (!user?.uid) return;

    let collRef;
    if (tab === "Following") {
      collRef = collection(db, "users", user.uid, "following");
    } else if (tab === "Followers") {
      collRef = collection(db, "users", user.uid, "followers");
    }

    if (collRef) {
      const unsub = onSnapshot(collRef, (snap) => {
        setFriends(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [user, tab]);

  // Search users
  useEffect(() => {
    if (tab !== "Search") return;

    let q;
    if (search.trim().length > 0) {
      q = query(collection(db, "users"), where("displayName", "==", search));
    } else {
      q = collection(db, "users");
    }

    const unsub = onSnapshot(q, (snap) => {
      const results = snap
        .docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.id !== user.uid);
      setFriends(results.filter((u) => !followingMap[u.id]));
    });

    return () => unsub();
  }, [tab, search, user, followingMap]);

  // Handlers
  const handleFollow = async (friend) => {
    try {
      await follow(user.uid, friend.id, profile, friend);
    } catch (err) {
      Alert.alert("Error", "Could not follow user. Try again.");
    }
  };

  const handleUnfollow = async (friendId) => {
    try {
      await unfollow(user.uid, friendId);
    } catch (err) {
      Alert.alert("Error", "Could not unfollow user. Try again.");
    }
  };

  const handleRemoveFollower = async (followerId) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "followers", followerId));
      await deleteDoc(doc(db, "users", followerId, "following", user.uid));
    } catch (err) {
      Alert.alert("Error", "Could not remove follower. Try again.");
    }
  };

  // Dropdown Actions
  const handleMenuAction = (action, item) => {
    setMenuVisible(null);
    if (action === "message") {
      navigation.navigate("Chat", {
        userId: item.id,
        userName: item.displayName,
      });
    } else if (action === "unfollow") {
      handleUnfollow(item.id);
    } else if (action === "share") {
      Alert.alert("Share", "Share feature coming soon!");
    }
  };

  const renderFriend = ({ item }) => {
    const isFollowing = !!followingMap[item.id];
    const followerButtonText = isFollowing ? "Message" : "Follow Back";

    return (
      <View style={styles.friendCard}>
        {/* Avatar */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          onPress={() =>
            navigation.navigate("Profile", {
              userId: item.id,
            })
          }
        >
          <Image
            source={{ uri: item.photoURL || "https://placehold.co/100x100" }}
            style={styles.avatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>
              {item.displayName || item.name || "Unknown"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        {tab === "Search" && !isFollowing && (
          <TouchableOpacity
            style={[styles.btn, styles.btnFilled]}
            onPress={() => handleFollow(item)}
          >
            <Text style={styles.btnFilledText}>Follow</Text>
          </TouchableOpacity>
        )}

        {tab === "Followers" && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={[
                styles.btn,
                isFollowing ? styles.btnOutlined : styles.btnFilled,
              ]}
              onPress={() =>
                isFollowing
                  ? navigation.navigate("Chat", {
                    userId: item.id,
                    userName: item.displayName,
                  })
                  : handleFollow(item)
              }
            >
              <Text
                style={isFollowing ? styles.btnOutlinedText : styles.btnFilledText}
              >
                {followerButtonText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveFollower(item.id)}
            >
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {tab === "Following" && (
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(item.id)}>
                <Icon name="dots-vertical" size={24} color="#ff6a3d" />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => handleMenuAction("message", item)}
              title="Message"
              titleStyle={styles.menuItemText}
              leadingIcon="message-text-outline"
            />
            <Menu.Item
              onPress={() => handleMenuAction("unfollow", item)}
              title="Unfollow"
              titleStyle={[styles.menuItemText, { color: "#e53935" }]}
              leadingIcon="account-remove"
            />
            <Menu.Item
              onPress={() => handleMenuAction("share", item)}
              title="Share"
              titleStyle={styles.menuItemText}
              leadingIcon="share-variant"
            />
          </Menu>
        )}
      </View>
    );
  };

  return (
    <Provider>
      <View style={styles.container}>
        <LinearGradient
          colors={["#F9F871", "#F28A47", "#DE5C76"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friends</Text>
          <View style={{ width: 28 }} />
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.activeTab]}
              onPress={() => setTab(t)}
            >
              <Text style={tab === t ? styles.activeText : styles.tabText}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        {tab === "Search" && (
          <View style={styles.searchWrapper}>
            <Icon name="magnify" size={22} color="#999" />
            <TextInput
              style={styles.search}
              placeholder="Search users..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}

        {/* Friends List */}
        <FlatList
          data={friends}
          keyExtractor={(i) => i.id}
          renderItem={renderFriend}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 14,
    marginHorizontal: 20,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.primary, fontWeight: "600" },
  activeText: { color: "#fff", fontWeight: "600" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },
  search: { flex: 1, paddingVertical: 10, marginLeft: 6, fontSize: 15 },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: "700", color: "#333" },

  // ✅ Unified Button Styles
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginLeft: 6,
  },
  btnFilled: {
    backgroundColor: colors.primary,
  },
  btnFilledText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  btnOutlined: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  btnOutlinedText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  // ❌ Red Cross Button
  removeBtn: {
    backgroundColor: "#e53935",
    marginLeft: 8,
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  menuContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 4,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
});
