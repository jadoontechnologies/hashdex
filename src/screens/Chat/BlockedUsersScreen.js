// src/screens/settings/BlockedUsersScreen.js
import React, { useState, useEffect, useContext } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { AuthContext } from "../../state/AuthContext";
import { db } from "../../services/firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";

// 🔹 Shared Components
import Header from "../../components/Header";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

export default function BlockedUsersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "blocked"),
      (snap) =>
        setBlockedUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
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
      <Avatar
        uri={item.photoURL || "https://placehold.co/100x100/eee/ccc?text=User"}
        size={50}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || "Unknown"}</Text>
      </View>
      <Button
        title="Unblock"
        variant="primary"
        onPress={() => unblockUser(item.id)}
        style={styles.unblockBtn}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Blocked Users" showBackButton />

      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="lock-closed-outline"
            title="No blocked users"
            message="You haven’t blocked anyone yet."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
});
