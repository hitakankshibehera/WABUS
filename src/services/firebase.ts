// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCAVoUVfD0PaQ4YFdm846zxPoxLJo5Cfns",
  authDomain: "wabus-c5a2a.firebaseapp.com",
  databaseURL: "https://wabus-c5a2a-default-rtdb.firebaseio.com",
  projectId: "wabus-c5a2a",
  storageBucket: "wabus-c5a2a.firebasestorage.app",
  messagingSenderId: "666950957792",
  appId: "1:666950957792:web:736e1d2bf1561510eaee85",
  measurementId: "G-5ZM2K8Y9C4"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Analytics safely in browser environments
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this runtime environment
  });
}
export const getAnalyticsInstance = () => analyticsInstance;

// Helper Auth API Methods
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Email Sign-In error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (error: any) {
    console.error('Firebase Sign-Up error:', error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
};

export const sendResetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Firebase Password Reset error:', error);
    throw error;
  }
};

export { FirebaseUser, onAuthStateChanged };
