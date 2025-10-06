import React, { useState, useEffect, useContext } from "react";
import { View, FlatList, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../components/Header"; // Reusable header

const BlockedUsersScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(
      collection(db, "users", user.uid, "blocked"),
      (snap) =>
        setBlockedUsers(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        )
    );

    return unsub;
  }, [user]);

  const unblockUser = async (userId) => {
    Alert.alert("Confirm", "Do you want to unblock this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "users", user.uid, "blocked", userId));
        },
      },
    ]);
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        style={styles.avatarBorder}
      >
        <Image
          source={{ uri: item.photoURL || "https://placehold.co/100x100" }}
          style={styles.avatar}
        />
      </LinearGradient>
      <Text style={styles.userName}>{item.displayName || "Unknown"}</Text>
      <TouchableOpacity
        style={styles.unblockBtn}
        onPress={() => unblockUser(item.id)}
      >
        <Text style={{ color: "#fff" }}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Header
        title="Blocked Users"
        navigation={navigation}
        // Optionally add onMenuPress for future options
      />
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
            No blocked users
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
  },
  avatarBorder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eee" },
  userName: { flex: 1, fontSize: 16, fontWeight: "700", color: "#333" },
  unblockBtn: { backgroundColor: "#ff6a3d", padding: 8, borderRadius: 25 },
});

export default BlockedUsersScreen;
