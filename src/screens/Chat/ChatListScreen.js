import React, { useState, useEffect, useContext } from "react";
import { View, FlatList, TouchableOpacity, Text, Image, StyleSheet, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Header from "../../components/Header"; // ✅ Use reusable Header

const generateChatId = (uid1, uid2) => (uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`);

const ChatListScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "following"),
      snap => setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [user]);

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() =>
        navigation.navigate("Chat", {
          userId: item.id,
          userName: item.displayName || item.name || "User",
          photoURL: item.photoURL || "https://placehold.co/100x100",
        })
      }
    >
      <LinearGradient colors={["#F9F871", "#F28A47", "#DE5C76"]} style={styles.avatarBorder}>
        <Image source={{ uri: item.photoURL || "https://placehold.co/100x100" }} style={styles.avatar} />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.friendName}>{item.displayName || item.name || "Unknown"}</Text>
        <Text style={styles.friendSubtitle}>Tap to chat</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ✅ Reusable Header with 3-dots menu */}
      <Header
        title="Friends"
        rightIcon="ellipsis-vertical"
        onRightPress={() => setMenuVisible(true)}
      />

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderFriend}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* 3-dots menu modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              navigation.navigate("BlockedUsers");
            }}>
              <Text style={styles.menuText}>Blocked Users</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  friendCard: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 14, backgroundColor: "#fff", borderRadius: 16, elevation: 3 },
  avatarBorder: { width: 68, height: 68, borderRadius: 34, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#eee" },
  friendName: { fontSize: 16, fontWeight: "700", color: "#333" },
  friendSubtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-start", alignItems: "flex-end" },
  menuBox: { marginTop: 60, marginRight: 10, backgroundColor: "#fff", borderRadius: 8, width: 160, elevation: 5 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuText: { fontSize: 15, color: "#333" },
});

export default ChatListScreen;
