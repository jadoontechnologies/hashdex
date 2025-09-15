import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuid } from 'uuid';

// Upload any file
export async function uploadFileAsync(uri, folder = 'uploads') {
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

// Delete file
export async function deleteFile(path) {
  const fileRef = ref(storage, path);
  return deleteObject(fileRef);
}
