import { getStorage, ref, getDownloadURL, uploadString } from 'firebase/storage';
import { app } from './firebase';
import { UserProfile } from '../types';

const storage = getStorage(app);

const profileRef = (uid: string) => ref(storage, `userProfiles/${uid}/profile.json`);

export const readUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const url = await getDownloadURL(profileRef(uid));
    const resp = await fetch(url);
    return (await resp.json()) as UserProfile;
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      return null;
    }
    console.error('Error reading user profile:', error);
    throw error;
  }
};

export const writeUserProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  await uploadString(profileRef(uid), JSON.stringify(profile), 'raw', {
    contentType: 'application/json',
  });
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const current = (await readUserProfile(uid)) || {
    id: uid,
    name: '',
    riskTolerance: 'steady',
    preferredStrategies: [],
  };
  const updated = { ...current, ...updates } as UserProfile;
  await writeUserProfile(uid, updated);
  return updated;
};
