import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

export const storage = getStorage(app);

export async function uploadJson(path: string, data: unknown): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    await uploadBytes(storageRef, blob);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload JSON to "${path}": ${message}`);
  }
}

export async function downloadJson<T = unknown>(path: string): Promise<T> {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download JSON from "${path}": ${message}`);
  }
}
