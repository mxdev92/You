import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBgQtCBkbmds2LFfFzNu08zFzMX4O0SGCk",
  authDomain: "qiwiq-3a8a1.firebaseapp.com",
  projectId: "qiwiq-3a8a1",
  storageBucket: "qiwiq-3a8a1.firebasestorage.app",
  messagingSenderId: "332378943784",
  appId: "1:332378943784:web:ef6d63bfe47c9959f5a01d",
  measurementId: "G-3PLLV0BRVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// Auth functions
export const loginWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};