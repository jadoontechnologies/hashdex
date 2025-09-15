import { db, now } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export async function follow(userId, targetId) {
  await setDoc(doc(db,'follows',userId,'following',targetId), { createdAt: now() });
  await setDoc(doc(db,'follows',targetId,'followers',userId), { createdAt: now() });
}

export async function unfollow(userId, targetId) {
  await deleteDoc(doc(db,'follows',userId,'following',targetId));
  await deleteDoc(doc(db,'follows',targetId,'followers',userId));
}

export async function addFriend(userId, targetId) {
  await setDoc(doc(db,'friends',userId,targetId), { status:'pending', initiatorId:userId, createdAt:now(), updatedAt:now() });
}
