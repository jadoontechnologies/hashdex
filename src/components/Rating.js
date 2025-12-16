// components/Rating.js
import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Rating({ visible, onClose, userId }) {
  const [rating, setRating] = useState(0);

  useEffect(() => {
    setRating(0); // reset rating whenever modal opens
  }, [visible]);

  const handleSubmit = async () => {
    if (rating === 0) return;

    try {
      // ✅ Save rating in Firebase
      await setDoc(doc(db, "appRatings", userId), {
        rating,
        createdAt: serverTimestamp(),
      });

      ToastAndroid.show("Thanks for your rating ❤️", ToastAndroid.SHORT);

      // -------------------------------------------------------------------
      // ⭐ Play Store / App Store redirect (commented out)
      //
      // 👉 When you upload your app:
      // if (rating >= 4) {
      //   Linking.openURL("market://details?id=com.yourapp"); // Android
      //   // Linking.openURL("itms-apps://apps.apple.com/app/idYOUR_APP_ID"); // iOS
      // }
      // -------------------------------------------------------------------

    } catch (err) {
      console.log("Error saving rating:", err);
    }

    onClose();
  };

  const handleLater = () => {
    onClose(); // just close popup for now
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={26} color="#333" />
          </TouchableOpacity>

          <Text style={styles.title}>Rate Our App</Text>

          {/* Heart Rating */}
          <View style={styles.heartsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? "heart" : "heart-outline"}
                  size={42}
                  color={i <= rating ? "#FF3B30" : "#ccc"}
                  style={{ marginHorizontal: 6 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>

          {/* Maybe Later */}
          <TouchableOpacity onPress={handleLater}>
            <Text style={styles.laterText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  title: { fontSize: 19, fontWeight: "700", marginBottom: 20 },
  heartsRow: { flexDirection: "row", marginBottom: 22 },
  submitBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  laterText: {
    marginTop: 2,
    color: "#555",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
