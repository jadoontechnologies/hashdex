// src/state/AuthContext.js
import React, { createContext, useEffect, useState, useContext } from "react";
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { auth, db, now } from "../services/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteField,
} from "firebase/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * ✅ Register for Expo push notifications and save token in Firestore
   */
  const registerPushToken = async (u) => {
    if (!u?.uid) return;

    try {
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

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const expoPushToken = tokenData?.data;

      if (!expoPushToken) {
        console.warn("❌ No Expo push token retrieved");
        return;
      }

      const userRef = doc(db, "users", u.uid);
      await updateDoc(userRef, {
        expoPushToken,
        tokenUpdatedAt: now(),
      });
      console.log("✅ Expo push token saved:", expoPushToken);
    } catch (err) {
      console.error("❌ Error registering push token:", err);
    }
  };

  /**
   * ✅ Handle Firebase Auth state changes
   */
  useEffect(() => {
    let unsubscribeProfile = null;
    let isMounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      try {
        // If no user is signed in
        if (!u) {
          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = null;

          // Try to remove push token (optional)
          if (user?.uid) {
            try {
              await updateDoc(doc(db, "users", user.uid), {
                expoPushToken: deleteField(),
              });
            } catch (e) {
              console.log("⚠️ Unable to clear token:", e.message);
            }
          }

          if (isMounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // User logged in
        setUser(u);

        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        // 🔹 Create profile if not exists
        if (!snap.exists()) {
          const newProfile = {
            displayName: u.displayName || "",
            email: u.email || "",
            photoURL: u.photoURL || "",
            joinedAt: now(),
            visibility: "public",
            counters: { followers: 0, following: 0, posts: 0 },
            firstRun: true, // 👈 Add this line
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }

        // 🔹 Listen for real-time profile updates
        unsubscribeProfile = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists() && isMounted) {
              setProfile(docSnap.data());
            }
          },
          (err) => console.error("❌ Profile snapshot error:", err)
        );

        // 🔹 Register for push notifications (safe async)
        await registerPushToken(u);

        if (isMounted) setLoading(false);
      } catch (err) {
        console.error("❌ Auth state error:", err);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  /**
   * ✅ Context value
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("❌ Sign-out error:", err);
      Alert.alert("Error", err.message || "Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, signOut }}>
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
