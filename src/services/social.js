import { db } from "./firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

/**
 * Follow another user
 */
export async function follow(userId, targetId, userProfile = {}, targetProfile = {}) {
  const followingRef = doc(db, "users", userId, "following", targetId);
  const followerRef = doc(db, "users", targetId, "followers", userId);

  await setDoc(followingRef, {
    name: targetProfile.displayName || targetProfile.username || "User",
    photoURL: targetProfile.photoURL || null,
    createdAt: Date.now(),
  });

  await setDoc(followerRef, {
    name: userProfile.displayName || userProfile.username || "User",
    photoURL: userProfile.photoURL || null,
    createdAt: Date.now(),
  });
}

/**
 * Unfollow another user
 */
export async function unfollow(userId, targetId) {
  const followingRef = doc(db, "users", userId, "following", targetId);
  const followerRef = doc(db, "users", targetId, "followers", userId);

  await deleteDoc(followingRef);
  await deleteDoc(followerRef);
}

/**
 * Send friend request (optional, if you want "friends")
 */
export async function addFriend(userId, targetId) {
  const friendRef = doc(db, "users", userId, "friends", targetId);
  await setDoc(friendRef, {
    status: "pending",
    initiatorId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
