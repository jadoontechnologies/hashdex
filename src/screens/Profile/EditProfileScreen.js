import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendEmailVerification } from "firebase/auth";
import { db, storage } from "../../services/firebase";
import { AuthContext } from "../../state/AuthContext";
import Header from "../../components/Header";
import { updateUserProfile } from "../../services/updateUserProfile";

export default function EditProfileScreen({ navigation }) {
  const { user, profile, setProfile, loading } = useContext(AuthContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const isVerified = user?.emailVerified;

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || profile.displayName?.split(" ")[0] || "");
      setLastName(profile.lastName || profile.displayName?.split(" ")[1] || "");
      setEmail(profile.email || user?.email || "");
      setWebsite(profile.website || "");
      setPhotoURL(profile.photoURL || "https://placehold.co/100x100");
    }
  }, [profile, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6A3D" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Please log in to edit your profile.</Text>
      </View>
    );
  }

  // 📸 PICK & UPLOAD PROFILE IMAGE
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setPhotoURL(downloadURL);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // 💾 SAVE PROFILE CHANGES
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "Please fill in both first and last name.");
      return;
    }

    const updatedProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      email: user.email, // ❗ Email won't be changed directly
      website: website.trim(),
      photoURL,
    };

    try {
      setSaving(true);

      await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
      setProfile((prev) => ({ ...prev, ...updatedProfile }));

      await updateUserProfile(user.uid, updatedProfile);

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Profile update failed:", err);
      let msg = "Failed to update profile. Please try again.";
      if (err.code === "auth/requires-recent-login") {
        msg = "Please re-login before updating your email.";
      }
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  // 📧 RESEND EMAIL VERIFICATION
  const handleResendVerification = async () => {
    try {
      setEmailSending(true);
      await sendEmailVerification(user);
      Alert.alert(
        "Verification Email Sent",
        `A verification link has been sent to ${user.email}. Please check your inbox.`
      );
    } catch (err) {
      console.error("Failed to send verification email:", err);
      Alert.alert("Error", "Unable to send verification email. Try again later.");
    } finally {
      setEmailSending(false);
    }
  };

  // ⚡ Handle Email Field Press
  const handleEmailPress = () => {
    if (!isVerified) {
      Alert.alert(
        "Email Not Verified",
        "Please verify your email before you can change it.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Resend Verification Email",
            onPress: handleResendVerification,
          },
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header title="Edit Profile" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Picture */}
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          <Image source={{ uri: photoURL }} style={styles.avatar} />
          {(uploading || saving) ? (
            <ActivityIndicator style={styles.cameraBadge} color="#fff" size="small" />
          ) : (
            <View style={styles.cameraBadge}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Email (non-editable but clickable if not verified) */}
          <TouchableOpacity activeOpacity={0.9} onPress={handleEmailPress}>
            <View pointerEvents="none">
              <TextInput
                style={[
                  styles.input,
                  !isVerified && { backgroundColor: "#f2f2f2", color: "#888" },
                ]}
                placeholder="Email"
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
          </TouchableOpacity>

          {!isVerified && (
            <View style={styles.verifyContainer}>
              <Text style={styles.verifyNote}>
                ⚠️ Your email is not verified. Tap the field or press below to resend.
              </Text>
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleResendVerification}
                disabled={emailSending}
              >
                <Text style={styles.verifyButtonText}>
                  {emailSending ? "Sending..." : "Resend Verification Email"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Website"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || uploading) && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving || uploading}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Done"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { alignItems: "center", padding: 16 },
  avatarContainer: { position: "relative", marginVertical: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 6,
    backgroundColor: "#FF6A3D",
    borderRadius: 14,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  form: { width: "100%", marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  verifyContainer: { marginVertical: 6, alignItems: "flex-start" },
  verifyNote: { color: "#DE5C76", fontSize: 14, marginBottom: 6 },
  verifyButton: {
    backgroundColor: "#FF6A3D",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  verifyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  saveButton: {
    marginTop: 30,
    width: "90%",
    backgroundColor: "#FF6A3D",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
