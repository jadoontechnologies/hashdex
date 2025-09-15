import { db, now } from './firebase';
import { doc, collection, addDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function addComment(postId, user, text) {
  return addDoc(collection(db,'posts',postId,'comments'), {
    authorId: user.uid,
    author: { displayName: user.displayName || user.email, photoURL: user.photoURL || '' },
    text,
    createdAt: now(),
    updatedAt: now(),
    isDeleted: false
  });
}

export async function toggleLike(postId, uid, liked) {
  const ref = doc(db,'posts',postId,'likes',uid);
  if(liked) return deleteDoc(ref);
  return setDoc(ref, { createdAt: now() });
}

export async function toggleSave(postId, uid, saved) {
  const ref = doc(db,'posts',postId,'saves',uid);
  if(saved) return deleteDoc(ref);
  return setDoc(ref, { createdAt: now() });
}
