import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { v4 as uuid } from 'uuid';

export async function uploadImageAsync(uri, folder='posts') {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
  const fileRef = ref(storage, `${folder}/${uuid()}.jpg`);
  await uploadBytes(fileRef, blob);
  blob.close();
  return getDownloadURL(fileRef);
}
