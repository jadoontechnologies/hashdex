// src/state/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from "react";
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { auth, db, now } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * ✅ Register for Expo push notifications and save token in Firestore
   */
  const registerPushToken = async (u) => {
    if (!u) return;

    try {
      // Check existing notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("🚫 Notifications not enabled by user");
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications in settings to receive alerts."
        );
        return;
      }

      // ✅ Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenData.data;

      if (expoPushToken) {
        // Save the Expo push token in Firestore
        await updateDoc(doc(db, "users", u.uid), {
          expoPushToken,
          tokenUpdatedAt: now(),
        });
        console.log("✅ Expo push token saved:", expoPushToken);
      } else {
        console.error("❌ Failed to retrieve Expo push token");
      }
    } catch (err) {
      console.error("❌ Error registering push token:", err);
    }
  };

  /**
   * ✅ Handle Firebase Auth state changes
   */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // Remove the user's push token on sign-out (optional)
        if (user?.uid) {
          await updateDoc(doc(db, "users", user.uid), {
            expoPushToken: deleteField(),
          });
        }
        
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(u);
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);

      // 🔹 Create user document if new
      if (!snap.exists()) {
        const newProfile = {
          displayName: u.displayName || "",
          email: u.email || "",
          photoURL: u.photoURL || "",
          joinedAt: now(),
          visibility: "public",
          counters: { followers: 0, following: 0, posts: 0 },
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }

      // 🔹 Listen for real-time updates
      const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) setProfile(docSnap.data());
      });

      // 🔹 Register or update Expo push token
      await registerPushToken(u);

      setLoading(false);
      return unsubscribeProfile;
    });

    return unsubscribeAuth;
  }, []);

  /**
   * ✅ Provide user, profile, and logout function
   */
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        setProfile,
        signOut: async () => {
          // Perform sign-out
          await signOut(auth);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * ✅ Hook for using auth context
 */
export function useAuth() {
  return useContext(AuthContext);
}
