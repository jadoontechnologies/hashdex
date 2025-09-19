// services/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence
} from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBsLBEpGV_YUiN85d76kxWOZ-eojnpkLPk",
  authDomain: "hashdex-a33e0.firebaseapp.com",
  databaseURL: "https://hashdex-a33e0-default-rtdb.firebaseio.com",
  projectId: "hashdex-a33e0",
  storageBucket: "hashdex-a33e0.appspot.com", // ✅ fixed
  messagingSenderId: "513308743657",
  appId: "1:513308743657:web:20841b31bcf352ad861d78",
  measurementId: "G-37P8LQMH3Y",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth safe init
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const now = () => serverTimestamp();
