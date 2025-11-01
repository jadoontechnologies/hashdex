// src/screens/Settings/SettingsScreen.js
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../state/AuthContext";
import Header from "../../components/Header";

export default function SettingsScreen() {
  const { signOut } = useContext(AuthContext);
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out this app! Download it from https://yourapp.link",
      });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: signOut, style: "destructive" },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Settings" />

      <View style={styles.list}>
        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            navigation.navigate("ProfileTab", { screen: "EditProfile" })
          }
        >
          <Text style={styles.label}>Edit Profile</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Change Password */}
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            navigation.navigate("ProfileTab", { screen: "ChangePassword" })
          }
        >
          <Text style={styles.label}>Change Password</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Blocked Accounts */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("BlockedUsers")}
        >
          <Text style={styles.label}>Blocked Accounts</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Share App */}
        <TouchableOpacity style={styles.item} onPress={handleShare}>
          <Text style={styles.label}>Share App</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            Alert.alert("Coming Soon", "Privacy Policy screen coming soon.")
          }
        >
          <Text style={styles.label}>Privacy Policy</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Terms of Service */}
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            Alert.alert("Coming Soon", "Terms of Service screen coming soon.")
          }
        >
          <Text style={styles.label}>Terms of Service</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <View style={[styles.item, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>App Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#ccc", true: "#f28b4771" }}
            thumbColor={notifications ? "#f28b47ff" : "#f4f3f4"}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 10,
    backgroundColor: "#fff",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  label: { fontSize: 16, color: "#333" },
  chevron: { fontSize: 18, color: "#999" },
  logout: {
    marginTop: 30,
    alignItems: "center",
  },
  logoutText: {
    color: "red",
    fontWeight: "600",
    fontSize: 16,
  },
});
