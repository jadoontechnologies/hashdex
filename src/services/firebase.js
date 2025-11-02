// src/services/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsLBEpGV_YUiN85d76kxWOZ-eojnpkLPk",
  authDomain: "hashdex-a33e0.firebaseapp.com",
  projectId: "hashdex-a33e0",
  storageBucket: "hashdex-a33e0.appspot.com",
  messagingSenderId: "513308743657",
  appId: "1:513308743657:web:20841b31bcf352ad861d78",
};

// ✅ Initialize Firebase app only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize Auth safely
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// ✅ Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
export const now = () => serverTimestamp();

// ✅ Export initialized Firebase app
export { app, auth };
