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

  // password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const renderPasswordInput = (value, setValue, show, setShow, placeholder) => (
    <View style={styles.inputWrapper}>
      <View style={styles.inputRow}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.5)"
          style={styles.input}
          secureTextEntry={!show}
          value={value}
          onChangeText={setValue}
        />
        <Pressable onPress={() => setShow(!show)} style={styles.eyeBtn}>
          <Image
            source={
              show
                ? require("../../../assets/icons/eye.png")
                : require("../../../assets/icons/eye-off.png")
            }
            style={[styles.eyeIcon, { tintColor: "black" }]}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
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

        {/* Password Inputs */}
        {renderPasswordInput(current, setCurrent, showCurrent, setShowCurrent, "Current Password")}
        {renderPasswordInput(newPass, setNewPass, showNew, setShowNew, "New Password")}
        {renderPasswordInput(confirm, setConfirm, showConfirm, setShowConfirm, "Confirm New Password")}
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  eyeBtn: {
    marginLeft: 10,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
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
