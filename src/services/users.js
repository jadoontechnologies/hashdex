import { db, now } from './firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

// Get user profile
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Update profile fields
export async function updateUser(uid, data) {
  return updateDoc(doc(db, 'users', uid), { ...data, updatedAt: now() });
}

// Set avatar after upload
export async function updateUserAvatar(uid, url) {
  return updateDoc(doc(db, 'users', uid), { photoURL: url, updatedAt: now() });
}

// Create if missing (used in AuthContext)
export async function ensureUserDoc(uid, data) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...data, createdAt: now() });
  }
}
