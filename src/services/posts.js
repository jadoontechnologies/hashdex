import { db, now } from './firebase';
import { addDoc, collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function createPost({ authorId, author, text, attachments=[], visibility='friends' }) {
  const hashtags = (text.match(/#\w+/g)||[]).map(t=>t.slice(1).toLowerCase());
  const payload = { authorId, author, text, attachments, hashtags, visibility, stats:{likes:0,comments:0,saves:0}, createdAt: now(), updatedAt: now() };
  return addDoc(collection(db,'posts'), payload);
}
