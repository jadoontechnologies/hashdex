import { db, now } from './firebase';
import { doc, setDoc, increment, updateDoc } from 'firebase/firestore';

export async function trackHashtags(tags=[]) {
  for(const t of tags){
    const ref = doc(db,'hashtags',t.toLowerCase());
    await setDoc(ref, { countPosts: increment(1), lastUsedAt: now() }, { merge:true });
  }
}
