import { db, now } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  where,
  serverTimestamp,
  increment,
  limit,
  startAfter,
} from 'firebase/firestore';

///////////////////////////////
// 🔹 Helper: Extract hashtags
///////////////////////////////
export function extractHashtags(text = '') {
  const regex = /#(\w+)/g;
  const tags = [];
  let match;
  while ((match = regex.exec(text))) {
    tags.push(match[1].toLowerCase());
  }
  return tags;
}

///////////////////////////////
// 🔹 Track hashtags globally
///////////////////////////////
export async function trackHashtagsGlobal(tags = [], delta = 1) {
  for (const t of tags) {
    const ref = doc(db, 'hashtags', t);
    await setDoc(
      ref,
      { countPosts: increment(delta), lastUsedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

///////////////////////////////
// 🔹 Track hashtags per-collection
///////////////////////////////
export async function trackCollectionTags(collectionId, tags = [], visibility = 'public', delta = 1) {
  for (const t of tags) {
    const ref = doc(db, 'collections', collectionId, 'tags', t);
    await setDoc(
      ref,
      {
        tag: t,
        counts: { [visibility]: increment(delta) },
        lastUsedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

///////////////////////////////
// 🔹 Create new collection
///////////////////////////////
export async function createCollection(uid, { title, description, visibility, cover }) {
  const payload = {
    ownerId: uid,
    title,
    description,
    visibility,
    cover: cover || {},
    stats: { items: 0, saves: 0, shares: 0, views: 0 },
    createdAt: now(),
    updatedAt: now(),
  };
  const ref = await addDoc(collection(db, 'collections'), payload);
  return ref.id;
}

///////////////////////////////
// 🔹 Fetch all user collections
///////////////////////////////
export async function getUserCollections(uid, lastVisible = null, limitCount = 10) {
  let q = query(
    collection(db, 'collections'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );
  if (lastVisible) {
    q = query(
      collection(db, 'collections'),
      where('ownerId', '==', uid),
      orderBy('updatedAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastVisible: lastDoc };
}

///////////////////////////////
// 🔹 Get single collection
///////////////////////////////
export async function getCollection(id) {
  const snap = await getDoc(doc(db, 'collections', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

///////////////////////////////
// 🔹 Update collection
///////////////////////////////
export async function updateCollection(id, data) {
  return updateDoc(doc(db, 'collections', id), { ...data, updatedAt: now() });
}

///////////////////////////////
// 🔹 Delete collection
///////////////////////////////
export async function deleteCollection(id) {
  return deleteDoc(doc(db, 'collections', id));
}

///////////////////////////////
// 🔹 Add post/item to collection
///////////////////////////////
export async function addItem(collectionId, { text, visibility = 'public', type = 'note', url = null }) {
  const hashtags = extractHashtags(text);

  // Add post to collection subcollection
  const ref = await addDoc(collection(db, 'collections', collectionId, 'items'), {
    type,              // note | image | link etc.
    text,
    url,
    hashtags,
    visibility,        // public | friends | private
    createdAt: now(),
    updatedAt: now(),
  });

  // Track hashtags globally + per collection
  if (hashtags.length) {
    await trackHashtagsGlobal(hashtags, +1);
    await trackCollectionTags(collectionId, hashtags, visibility, +1);
  }

  // Update collection stats
  await updateDoc(doc(db, 'collections', collectionId), {
    'stats.items': increment(1),
    updatedAt: now(),
  });

  return ref.id;
}

///////////////////////////////
// 🔹 Fetch items inside a collection
///////////////////////////////
export async function getCollectionItems(collectionId, lastVisible = null, limitCount = 20) {
  let q = query(
    collection(db, 'collections', collectionId, 'items'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  if (lastVisible) {
    q = query(
      collection(db, 'collections', collectionId, 'items'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastVisible: lastDoc };
}

///////////////////////////////
// 🔹 Get hashtags grouped by visibility (fast, from tags subcollection)
///////////////////////////////
export async function getCollectionHashtags(collectionId) {
  const snap = await getDocs(collection(db, 'collections', collectionId, 'tags'));
  const grouped = { public: [], friends: [], private: [] };

  snap.docs.forEach((d) => {
    const data = d.data();
    const counts = data.counts || {};
    if (counts.public > 0) grouped.public.push(data.tag);
    if (counts.friends > 0) grouped.friends.push(data.tag);
    if (counts.private > 0) grouped.private.push(data.tag);
  });

  return {
    public: grouped.public.sort(),
    friends: grouped.friends.sort(),
    private: grouped.private.sort(),
  };
}

///////////////////////////////
// 🔹 Get posts for a specific hashtag + visibility
///////////////////////////////
export async function getHashtagPosts(collectionId, hashtag, visibility, lastVisible = null, limitCount = 20) {
  let q = query(
    collection(db, 'collections', collectionId, 'items'),
    where('hashtags', 'array-contains', hashtag.toLowerCase()),
    where('visibility', '==', visibility),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  if (lastVisible) {
    q = query(
      collection(db, 'collections', collectionId, 'items'),
      where('hashtags', 'array-contains', hashtag.toLowerCase()),
      where('visibility', '==', visibility),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );
  }

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastVisible: lastDoc };
}
import { db, now } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  where,
  serverTimestamp,
  increment,
  limit,
  startAfter,
} from 'firebase/firestore';


export function extractHashtags(text = '') {
  const regex = /#(\w+)/g;
  const tags = [];
  let match;
  while ((match = regex.exec(text))) {
    tags.push(match[1].toLowerCase());
  }
  return tags;
}


export async function trackHashtagsGlobal(tags = [], delta = 1) {
  for (const t of tags) {
    const ref = doc(db, 'hashtags', t);
    await setDoc(
      ref,
      { countPosts: increment(delta), lastUsedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

export async function trackCollectionTags(collectionId, tags = [], visibility = 'public', delta = 1) {
  for (const t of tags) {
    const ref = doc(db, 'collections', collectionId, 'tags', t);
    await setDoc(
      ref,
      {
        tag: t,
        counts: { [visibility]: increment(delta) },
        lastUsedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export async function createCollection(uid, { title, description, visibility, cover }) {
  const payload = {
    ownerId: uid,
    title,
    description,
    visibility,
    cover: cover || {},
    stats: { items: 0, saves: 0, shares: 0, views: 0 },
    createdAt: now(),
    updatedAt: now(),
  };
  const ref = await addDoc(collection(db, 'collections'), payload);
  return ref.id;
}

export async function getUserCollections(uid, lastVisible = null, limitCount = 10) {
  let q = query(
    collection(db, 'collections'),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );
  if (lastVisible) {
    q = query(
      collection(db, 'collections'),
      where('ownerId', '==', uid),
      orderBy('updatedAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastVisible: lastDoc };
}

export async function getCollection(id) {
  const snap = await getDoc(doc(db, 'collections', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateCollection(id, data) {
  return updateDoc(doc(db, 'collections', id), { ...data, updatedAt: now() });
}


export async function deleteCollection(id) {
  return deleteDoc(doc(db, 'collections', id));
}

export async function addItem(collectionId, { text, visibility = 'public', type = 'note', url = null }) {
  const hashtags = extractHashtags(text);

  // Add post to collection subcollection
  const ref = await addDoc(collection(db, 'collections', collectionId, 'items'), {
    type,              
    text,
    url,
    hashtags,
    visibility,       
    createdAt: now(),
    updatedAt: now(),
  });

  if (hashtags.length) {
    await trackHashtagsGlobal(hashtags, +1);
    await trackCollectionTags(collectionId, hashtags, visibility, +1);
  }

  // Update collection stats
  await updateDoc(doc(db, 'collections', collectionId), {
    'stats.items': increment(1),
    updatedAt: now(),
  });

  return ref.id;
}

export async function getCollectionItems(collectionId, lastVisible = null, limitCount = 20) {
  let q = query(
    collection(db, 'collections', collectionId, 'items'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  if (lastVisible) {
    q = query(
      collection(db, 'collections', collectionId, 'items'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastVisible: lastDoc };
}

export async function getCollectionHashtags(collectionId) {
  const snap = await getDocs(collection(db, 'collections', collectionId, 'tags'));
  const grouped = { public: [], friends: [], private: [] };

  snap.docs.forEach((d) => {
    const data = d.data();
    const counts = data.counts || {};
    if (counts.public > 0) grouped.public.push(data.tag);
    if (counts.friends > 0) grouped.friends.push(data.tag);
    if (counts.private > 0) grouped.private.push(data.tag);
  });

  return {
    public: grouped.public.sort(),
    friends: grouped.friends.sort(),
    private: grouped.private.sort(),
  };
}

export async function getHashtagPosts(collectionId, hashtag, visibility, lastVisible = null, limitCount = 20) {
  let q = query(
    collection(db, 'collections', collectionId, 'items'),
    where('hashtags', 'array-contains', hashtag.toLowerCase()),
    where('visibility', '==', visibility),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  if (lastVisible) {
    q = query(
      collection(db, 'collections', collectionId, 'items'),
      where('hashtags', 'array-contains', hashtag.toLowerCase()),
      where('visibility', '==', visibility),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );
  }

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastVisible: lastDoc };
}
