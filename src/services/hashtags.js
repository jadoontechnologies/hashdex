// src/services/Hashtags.js
import { db, now } from "./firebase";
import { doc, setDoc, increment } from "firebase/firestore";

/**
 * Track hashtags globally
 * - Increments post count
 * - Updates last used timestamp
 */
export async function trackHashtags(tags = []) {
  if (!tags || !tags.length) return;
  for (const t of tags) {
    const cleanTag = t.toLowerCase().trim().replace("#", "");
    if (!cleanTag) continue;

    const ref = doc(db, "hashtags", cleanTag);
    await setDoc(
      ref,
      {
        tag: cleanTag,
        countPosts: increment(1),
        lastUsedAt: now(),
      },
      { merge: true }
    );
  }
}
