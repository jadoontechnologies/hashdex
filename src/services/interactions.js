// services/interactions.js
import { db, now } from './firebase';
import { doc, collection, addDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

// 💬 Add comment and increase comments count
export async function addComment(postId, user, text) {
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    authorId: user.uid,
    author: {
      displayName: user.displayName || user.email,
      photoURL: user.photoURL || ''
    },
    text,
    createdAt: now(),          // Firestore server timestamp
    createdAtLocal: new Date(),// 👈 Local timestamp for instant UI
    updatedAt: now(),
    isDeleted: false
  });

  // update comment count on post
  const ref = doc(db, 'posts', postId);
  await updateDoc(ref, {
    'stats.comments': increment(1)
  });
}

// ❤️ Like / Unlike post and update stats
export async function toggleLike(postId, uid, liked) {
  const ref = doc(db, 'posts', postId);
  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(uid) : arrayUnion(uid),
    'stats.likes': increment(liked ? -1 : 1)
  });
}

// 🔖 Save / Unsave post and update stats
export async function toggleSave(postId, uid, saved) {
  const ref = doc(db, 'posts', postId);
  await updateDoc(ref, {
    savedBy: saved ? arrayRemove(uid) : arrayUnion(uid),
    'stats.saves': increment(saved ? -1 : 1)
  });
}
