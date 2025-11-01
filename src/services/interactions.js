// src/services/interactions.js
import { db, now } from "./firebase";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
} from "firebase/firestore";
import { sendNotification } from "./notifications"; // ✅ Notification helper

/**
 * 💬 Add comment and increase comments count + send notification
 */
export async function addComment(postId, user, text) {
  if (!user || !postId || !text) return;

  // 1️⃣ Add comment to Firestore
  await addDoc(collection(db, "posts", postId, "comments"), {
    authorId: user.uid,
    author: {
      displayName: user.displayName || user.email,
      photoURL: user.photoURL || "",
    },
    text,
    createdAt: now(),
    createdAtLocal: new Date(),
    updatedAt: now(),
    isDeleted: false,
  });

  // 2️⃣ Update post comment count
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const post = postSnap.data();
    if (!post.stats) {
      await updateDoc(postRef, { stats: { likes: 0, comments: 0, saves: 0 } });
    }
  }
  await updateDoc(postRef, { "stats.comments": increment(1) });

  // 3️⃣ Send notification to post owner
  if (postSnap.exists()) {
    const post = postSnap.data();
    if (post.authorId && post.authorId !== user.uid) {
      await sendNotification(post.authorId, {
        type: "comment",
        message: `${user.displayName || "Someone"} commented on your post: "${text.slice(
          0,
          60
        )}..."`,
        postId,
        fromUserId: user.uid,
        fromUserName: user.displayName || "User",
        fromUserPhoto: user.photoURL || "",
      });
    }
  }
}

/**
 * ❤️ Like / Unlike post and update stats + send notification
 */
export async function toggleLike(postId, user, liked) {
  if (!postId || !user?.uid) return;

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const post = postSnap.data();

  // Ensure stats object exists
  if (!post.stats) {
    await updateDoc(postRef, { stats: { likes: 0, comments: 0, saves: 0 } });
  }

  // Update like state and increment/decrement
  await updateDoc(postRef, {
    likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    "stats.likes": increment(liked ? -1 : 1),
  });

  // 3️⃣ Send notification only on like (not unlike)
  if (!liked && post.authorId && post.authorId !== user.uid) {
    await sendNotification(post.authorId, {
      type: "like",
      message: `❤️ ${user.displayName || "Someone"} liked your post.`,
      postId,
      fromUserId: user.uid,
      fromUserName: user.displayName || "User",
      fromUserPhoto: user.photoURL || "",
    });
  }
}

/**
 * 🔖 Save / Unsave post and update stats + optional notification
 */
export async function toggleSave(postId, user, saved) {
  if (!postId || !user?.uid) return;

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return;

  const post = postSnap.data();

  // Ensure stats object exists
  if (!post.stats) {
    await updateDoc(postRef, { stats: { likes: 0, comments: 0, saves: 0 } });
  }

  // Update save state and increment/decrement
  await updateDoc(postRef, {
    savedBy: saved ? arrayRemove(user.uid) : arrayUnion(user.uid),
    "stats.saves": increment(saved ? -1 : 1),
  });

  // (optional) Notify post owner on save
  if (!saved && post.authorId && post.authorId !== user.uid) {
    await sendNotification(post.authorId, {
      type: "save",
      message: `🔖 ${user.displayName || "Someone"} saved your post.`,
      postId,
      fromUserId: user.uid,
      fromUserName: user.displayName || "User",
      fromUserPhoto: user.photoURL || "",
    });
  }
}
