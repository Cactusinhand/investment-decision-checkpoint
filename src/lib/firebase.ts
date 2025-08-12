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
  const methods = await fetchSignInMethodsForEmail(auth, email);
  if (methods.length === 0) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }
  if (methods.includes('password')) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }
  if (methods.includes('github.com')) {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }
  if (methods.includes('google.com')) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }
  throw new Error(`Unsupported sign-in methods: ${methods.join(', ')}`);
};
