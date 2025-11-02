import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; // ✅ Expo compatible
import Header from "../../components/Header";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const { height: screenHeight } = Dimensions.get("window");

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async () => {
    if (!current || !newPass || !confirm) {
      return Alert.alert("Error", "Please fill all fields.");
    }
    if (newPass !== confirm) {
      return Alert.alert("Error", "New passwords do not match.");
    }

    try {
      setLoading(true);
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      Alert.alert("Success", "Password updated successfully!");
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* ✅ Reusable Header */}
      <Header title="Change Password" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Top illustration */}
        <Image
          source={require("../../../assets/images/forgot.png")}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Current Password */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#444" style={styles.icon} />
            <TextInput
              placeholder="Current Password"
              placeholderTextColor="rgba(0,0,0,0.5)"
              style={styles.input}
              secureTextEntry
              value={current}
              onChangeText={setCurrent}
            />
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <Ionicons name="key-outline" size={20} color="#444" style={styles.icon} />
            <TextInput
              placeholder="New Password"
              placeholderTextColor="rgba(0,0,0,0.5)"
              style={styles.input}
              secureTextEntry
              value={newPass}
              onChangeText={setNewPass}
            />
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#444" style={styles.icon} />
            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor="rgba(0,0,0,0.5)"
              style={styles.input}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Gradient Button */}
      <LinearGradient
        colors={["#F9F871", "#F28A47", "#DE5C76"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaContainer}
      >
        <Pressable
          onPress={handleChangePassword}
          style={{ width: "100%", alignItems: "center", paddingVertical: 16 }}
        >
          <Text style={styles.ctaText}>{loading ? "Updating…" : "Update Password"}</Text>
        </Pressable>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 20,
    justifyContent: "flex-start",
  },
  image: {
    width: "60%",
    height: screenHeight * 0.25,
    alignSelf: "center",
    marginTop: 75,
    marginBottom: 50,
  },
  inputWrapper: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  ctaContainer: {
    width: "100%",
    borderRadius: 0,
    position: "absolute",
    bottom: 0,
    left: 0,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
