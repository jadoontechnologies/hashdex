import { db, now } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

// Create new collection
export async function createCollection(uid, { title, description, visibility }) {
  const payload = {
    ownerId: uid,
    title,
    description,
    visibility,
    cover: {},
    tags: [],
    stats: { items: 0, saves: 0, shares: 0, views: 0 },
    createdAt: now(),
    updatedAt: now(),
  };
  const ref = await addDoc(collection(db, 'collections'), payload);
  return ref.id;
}

// Fetch user collections
export async function getUserCollections(uid) {
  const q = query(
    collection(db, 'collections'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Get single collection
export async function getCollection(id) {
  const snap = await getDoc(doc(db, 'collections', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Update collection
export async function updateCollection(id, data) {
  return updateDoc(doc(db, 'collections', id), { ...data, updatedAt: now() });
}

// Delete collection
export async function deleteCollection(id) {
  return deleteDoc(doc(db, 'collections', id));
}

// Add item to collection
export async function addItem(collectionId, item) {
  return addDoc(collection(db, 'collections', collectionId, 'items'), {
    ...item,
    createdAt: now(),
    updatedAt: now(),
  });
}

// Fetch items
export async function getCollectionItems(collectionId) {
  const snap = await getDocs(collection(db, 'collections', collectionId, 'items'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
