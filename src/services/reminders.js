import { db, now } from './firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function createReminder(uid, title, dueAt) {
  return addDoc(collection(db,'reminders'), { ownerId: uid, title, dueAt, status:'open', createdAt: now(), updatedAt: now() });
}
export async function completeReminder(reminderId) {
  return updateDoc(doc(db,'reminders', reminderId), { status:'done', updatedAt: now() });
}
