import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';

export function usePosts({ visibility, authorId }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let q = query(collection(db,'posts'), orderBy('createdAt','desc'));
    if (visibility) q = query(collection(db,'posts'), where('visibility','==',visibility), orderBy('createdAt','desc'));
    if (authorId) q = query(collection(db,'posts'), where('authorId','==',authorId), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    });
    return unsub;
  }, [visibility, authorId]);

  return posts;
}
