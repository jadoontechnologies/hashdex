import React, { createContext, useEffect, useState, useContext } from 'react';
import { auth, db, now } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);

          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);

          if (!snap.exists()) {
            const newProfile = {
              displayName: u.displayName || '',
              photoURL: u.photoURL || '',
              username: '',
              firstRun: true,
              joinedAt: now(),
              visibility: 'public',
              counters: { followers: 0, following: 0, posts: 0, collections: 0 },
            };
            await setDoc(ref, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(snap.data());
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('AuthContext error:', e);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    setProfile,
    loading,
    signOut: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
