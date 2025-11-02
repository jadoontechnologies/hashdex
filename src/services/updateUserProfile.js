// src/services/updateUserProfile.js
import { db, now } from "./firebase";
import { getAuth, updateEmail } from "firebase/auth";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
  startAfter,
} from "firebase/firestore";

/**
 * Updates user profile everywhere:
 * - Firebase Auth email (only if changed)
 * - Firestore users doc
 * - Posts, comments, messages, followers/following, chats
 */
export async function updateUserProfile(
  uid,
  { firstName, lastName, photoURL, email }
) {
  const fullName = `${firstName} ${lastName}`.trim();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) throw new Error("User not authenticated");

  // ✅ 1. Try updating Firebase Auth email (only if changed)
  if (email && email !== currentUser.email) {
    try {
      await updateEmail(currentUser, email);
      console.log("✅ Auth email updated");
    } catch (err) {
      console.warn(
        "⚠️ Skipped email update (not verified or needs re-login):",
        err.message
      );
      // Do NOT throw — continue updating other info
    }
  }

  // ✅ 2. Update main Firestore profile
  await updateDoc(doc(db, "users", uid), {
    firstName,
    lastName,
    displayName: fullName,
    photoURL,
    email: email || currentUser.email,
    updatedAt: now(),
  });

  // 🔹 Helper for batch updates
  async function batchUpdate(collectionName, userField, updateFields) {
    const batchSize = 500;
    let lastDoc;

    while (true) {
      const q = lastDoc
        ? query(
            collection(db, collectionName),
            where(userField, "==", uid),
            startAfter(lastDoc),
            limit(batchSize)
          )
        : query(collection(db, collectionName), where(userField, "==", uid), limit(batchSize));

      const snap = await getDocs(q);
      if (snap.empty) break;

      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.update(d.ref, updateFields));
      await batch.commit();

      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.docs.length < batchSize) break;
    }
  }

  // ✅ 3. Update related collections
  await batchUpdate("posts", "authorId", {
    authorName: fullName,
    authorPhoto: photoURL,
  });

  await batchUpdate("comments", "userId", {
    userName: fullName,
    userPhoto: photoURL,
  });

  await batchUpdate("messages", "fromId", {
    fromName: fullName,
    fromPhoto: photoURL,
  });

  // ✅ 4. Update followers/following info
  const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
  for (const f of followersSnap.docs) {
    await updateDoc(doc(db, "users", f.id, "following", uid), {
      displayName: fullName,
      photoURL,
      updatedAt: now(),
    });
  }

  const followingSnap = await getDocs(collection(db, "users", uid, "following"));
  for (const f of followingSnap.docs) {
    await updateDoc(doc(db, "users", f.id, "followers", uid), {
      displayName: fullName,
      photoURL,
      updatedAt: now(),
    });
  }

  // ✅ 5. Update chats participant info
  const chatsSnap = await getDocs(
    query(collection(db, "chats"), where("participants", "array-contains", uid))
  );
  for (const chatDoc of chatsSnap.docs) {
    const chatData = chatDoc.data();
    if (chatData.participantInfo && chatData.participantInfo[uid]) {
      await updateDoc(chatDoc.ref, {
        [`participantInfo.${uid}`]: { displayName: fullName, photoURL },
      });
    }
  }

  console.log("✅ User profile updated everywhere successfully!");
}
