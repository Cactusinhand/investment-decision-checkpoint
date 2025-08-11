import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyD8IVZ_naxv9oXGTqAJ2heGLWXz_W_22b8',
  authDomain: 'invest-checkout-web-app.firebaseapp.com',
  projectId: 'invest-checkout-web-app',
  storageBucket: 'invest-checkout-web-app.firebasestorage.app',
  messagingSenderId: '351975819964',
  appId: '1:351975819964:web:59f412913c879e2a155eb9',
  measurementId: 'G-5Z3DF5TYX7',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInWithGitHub = async () => {
  const provider = new GithubAuthProvider();
  provider.addScope('user:email');
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logOut = () => signOut(auth);
