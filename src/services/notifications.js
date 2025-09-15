import { db, now } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function sendNotification(toUid, payload) {
  return addDoc(collection(db,'users',toUid,'notifications'), {
    ...payload,
    read:false,
    createdAt: now()
  });
}
