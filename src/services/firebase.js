import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBsLBEpGV_YUiN85d76kxWOZ-eojnpkLPk",
  authDomain: "hashdex-a33e0.firebaseapp.com",
  databaseURL: "https://hashdex-a33e0-default-rtdb.firebaseio.com",
  projectId: "hashdex-a33e0",
  storageBucket: "hashdex-a33e0.firebasestorage.app",
  messagingSenderId: "513308743657",
  appId: "1:513308743657:web:20841b31bcf352ad861d78",
  measurementId: "G-37P8LQMH3Y",
};

const app = initializeApp(firebaseConfig);

// ✅ Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// helper for Firestore timestamps
export const now = () => serverTimestamp();
