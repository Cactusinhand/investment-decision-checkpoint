import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate storage bucket naming to avoid misconfiguration
const isStorageBucketValid =
  typeof firebaseConfig.storageBucket === 'string' &&
  firebaseConfig.storageBucket.endsWith('.appspot.com');

if (!isStorageBucketValid) {
  console.error(
    `Invalid Firebase storage bucket: ${firebaseConfig.storageBucket}. It must end with "\.appspot.com". Storage will be disabled.`
  );
}

// Only initialize Firebase if we have the required configuration
let app;
let auth;
let storage;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    storage = isStorageBucketValid ? getStorage(app) : null;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    auth = null;
    storage = null;
  }
} else {
  console.warn('Firebase configuration is incomplete. Authentication features will be disabled.');
  auth = null;
  storage = null;
}

export { auth, storage };

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase authentication is not configured. Please set up Firebase configuration.');
  }
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    return null;
  }
};

export const signInWithGitHub = async () => {
  if (!auth) {
    throw new Error('Firebase authentication is not configured. Please set up Firebase configuration.');
  }
  try {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during GitHub sign-in:", error);
    return null;
  }
};

export const logOut = async () => {
  if (!auth) {
    return;
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during sign-out:", error);
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase authentication is not configured. Please set up Firebase configuration.');
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error during email registration:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase authentication is not configured. Please set up Firebase configuration.');
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error during email sign-in:', error);
    throw error;
  }
};

export const signUpOrSignIn = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase authentication is not configured. Please set up Firebase configuration.');
  }
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);

    if (methods.length === 0) {
      // New user, create an account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    }

    if (methods.includes('password')) {
      // Existing user with password, sign them in
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    }

    // If email is associated with a social provider, inform the user.
    if (methods.includes('google.com')) {
      throw new Error('This email is already associated with a Google account. Please sign in with Google.');
    }

    if (methods.includes('github.com')) {
      throw new Error('This email is already associated with a GitHub account. Please sign in with GitHub.');
    }

    // Fallback for other unhandled methods
    throw new Error(`Unsupported sign-in methods for this email: ${methods.join(', ')}`);
  } catch (error) {
    console.error('Error during sign up or sign in:', error);
    throw error;
  }
};
