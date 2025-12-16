import { auth, db, now } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function register({ email, password, displayName }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  // Create user profile doc
  const ref = doc(db, 'users', cred.user.uid);
  await setDoc(ref, {
    displayName: displayName || '',
    username: '',
    photoURL: '',
    firstRun: true,
    joinedAt: now(),
    visibility: 'public',
    counters: { followers: 0, following: 0, posts: 0, collections: 0 },
  });
  return cred.user;
}

export async function login({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
