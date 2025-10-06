// src/services/Hashtags.js
import { db, now } from "./firebase";
import {
  doc,
  setDoc,
  updateDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";

/**
 * Track hashtags across global + collection context
 * @param {string[]} tags - array of hashtags
 * @param {string} postId - Firestore post document ID
 * @param {string} visibility - "public" | "friends" | "private"
 * @param {string|null} collectionId - optional collection id
 */
export async function trackHashtags(
  tags = [],
  postId = null,
  visibility = "public",
  collectionId = null
) {
  if (!tags || !tags.length) return;

  for (const raw of tags) {
    const cleanTag = raw.toLowerCase().trim().replace(/^#/, "");
    if (!cleanTag) continue;

    // 1) Global hashtag stats
    const tagRef = doc(db, "hashtags", cleanTag);
    await setDoc(
      tagRef,
      {
        tag: cleanTag,
        countPosts: increment(1),
        lastUsedAt: now(),
      },
      { merge: true }
    );

    if (postId) {
      // 2) Per-hashtag post reference
      const postRef = doc(db, "hashtags", cleanTag, "posts", postId);
      await setDoc(
        postRef,
        {
          postId,
          visibility,
          collectionId: collectionId || null,
          createdAt: now(),
        },
        { merge: true }
      );
    }

    // 3) Collection-level hashtag mapping
    if (collectionId) {
      const colTagId = `${collectionId}_${cleanTag}`;
      const colTagRef = doc(db, "collectionHashtags", colTagId);
      await setDoc(
        colTagRef,
        {
          tag: cleanTag,
          collectionId,
          countPosts: increment(1),
          lastUsedAt: now(),
        },
        { merge: true }
      );
    }
  }
}

/**
 * Update hashtag counts when a post changes visibility
 * (e.g., public → private, private → public)
 */
export async function updateHashtagCounts(tags = [], oldVis, newVis) {
  if (!tags || tags.length === 0 || oldVis === newVis) return;

  const becamePublic = oldVis !== "public" && newVis === "public";
  const becamePrivate = oldVis === "public" && newVis !== "public";

  for (const raw of tags) {
    const cleanTag = raw.toLowerCase().trim().replace(/^#/, "");
    if (!cleanTag) continue;

    const tagRef = doc(db, "hashtags", cleanTag);

    if (becamePublic) {
      await updateDoc(tagRef, { countPosts: increment(1) });
    } else if (becamePrivate) {
      await updateDoc(tagRef, { countPosts: increment(-1) });
    }
  }
}

/**
 * Remove hashtags when a post is deleted
 * @param {string[]} tags
 * @param {string} postId
 */
export async function removeHashtags(tags = [], postId) {
  if (!tags || tags.length === 0) return;

  for (const raw of tags) {
    const cleanTag = raw.toLowerCase().trim().replace(/^#/, "");
    if (!cleanTag) continue;

    // 1) Decrement global hashtag count
    const tagRef = doc(db, "hashtags", cleanTag);
    await updateDoc(tagRef, { countPosts: increment(-1) });

    // 2) Remove post reference from hashtag
    const postRef = doc(db, "hashtags", cleanTag, "posts", postId);
    await deleteDoc(postRef);
  }
}
