// src/screens/ChatList/ChatListScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
} from "react-native";
import { AuthContext } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";

// 🔹 Shared Components
import Header from "../../components/Header";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";

const generateChatId = (uid1, uid2) =>
  uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

export default function ChatListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState({});
  const [menuVisible, setMenuVisible] = useState(false);

  // 🔹 Load friend list (following)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "following"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFriends(data);
      }
    );
    return () => unsub();
  }, [user]);

  // 🔹 Listen for chat updates
  useEffect(() => {
    if (!user?.uid || friends.length === 0) return;
    const unsubs = [];

    friends.forEach((friend) => {
      const chatId = generateChatId(user.uid, friend.id);
      const chatRef = doc(db, "chats", chatId);
      const unsub = onSnapshot(chatRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setChats((prev) => ({
          ...prev,
          [friend.id]: {
            lastMessage: data.lastMessage || "",
            unread: data.unreadBy?.includes(user.uid) || false,
            updatedAt: data.updatedAt?.toMillis?.() || 0,
          },
        }));
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u && u());
  }, [friends, user]);

  // 🔹 Mark chat as read when opened
  const handleOpenChat = async (friend) => {
    const chatId = generateChatId(user.uid, friend.id);
    const chatRef = doc(db, "chats", chatId);

    try {
      await updateDoc(chatRef, { unreadBy: [] });
    } catch (err) {
      console.warn("Failed to update unreadBy:", err);
    }

    navigation.navigate("Chat", {
      userId: friend.id,
      userName: friend.displayName || "User",
      photoURL: friend.photoURL || "https://placehold.co/100x100",
    });
  };

  // 🔹 Sort chats: unread first, then by latest update
  const sortedFriends = [...friends].sort((a, b) => {
    const aData = chats[a.id] || {};
    const bData = chats[b.id] || {};
    if (aData.unread && !bData.unread) return -1;
    if (!aData.unread && bData.unread) return 1;
    return (bData.updatedAt || 0) - (aData.updatedAt || 0);
  });

  const renderFriend = ({ item }) => {
    const chat = chats[item.id] || {};
    const unread = chat.unread;
    const lastMessage = chat.lastMessage || "Tap to chat";

    return (
      <TouchableOpacity
        style={[styles.friendCard, unread && { backgroundColor: "#fff8e1" }]}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.8}
      >
        <Avatar
          uri={item.photoURL || "https://placehold.co/100x100/eee/ccc?text=User"}
          size={64}
        />

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={[
              styles.friendName,
              unread && { fontWeight: "900", color: "#000" },
            ]}
          >
            {item.displayName || "Unknown"}
          </Text>
          <Text
            style={[
              styles.friendSubtitle,
              unread && { fontWeight: "700", color: "#333" },
            ]}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Chats"
        rightIcon="ellipsis-vertical"
        onRightPress={() => setMenuVisible(true)}
      />

      <FlatList
        data={sortedFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="No chats yet"
            message="Start a conversation with your friends!"
          />
        }
      />

      {/* 🔹 Menu (Blocked Users) */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("BlockedUsers");
              }}
            >
              <Text style={styles.menuText}>Blocked Users</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 3,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  friendSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuBox: {
    marginTop: 60,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 160,
    elevation: 5,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuText: { fontSize: 15, color: "#333" },
});
