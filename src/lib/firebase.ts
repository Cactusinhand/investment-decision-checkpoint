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
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { EvaluationResult } from '../types';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const storage = getStorage(app);

export const signInWithGoogle = async () => {
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
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during sign-out:", error);
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error during email registration:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Error during email sign-in:', error);
    throw error;
  }
};

export const signUpOrSignIn = async (email: string, password: string) => {
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

/**
 * Upload an evaluation result for a decision to Firebase Storage.
 * The result is stored as JSON at `decisionEvaluations/{uid}/{decisionId}.json`.
 */
export const uploadEvaluationResult = async (
  uid: string,
  decisionId: string,
  result: EvaluationResult
) => {
  const fileRef = ref(storage, `decisionEvaluations/${uid}/${decisionId}.json`);
  await uploadString(fileRef, JSON.stringify(result), 'raw', {
    contentType: 'application/json',
  });
};

/**
 * Load an evaluation result for a decision from Firebase Storage.
 * Returns `null` if no stored result exists.
 */
export const loadEvaluationResult = async (
  uid: string,
  decisionId: string
): Promise<EvaluationResult | null> => {
  try {
    const fileRef = ref(storage, `decisionEvaluations/${uid}/${decisionId}.json`);
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    const data = await response.json();
    return data as EvaluationResult;
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      return null;
    }
    console.error('Error loading evaluation result:', error);
    throw error;
  }
};
