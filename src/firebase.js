import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyA9QHltKv06Djup-SoLkOOK5siycIGznRU",
  authDomain: "mobilesubscription-8b2c9.firebaseapp.com",
  projectId: "mobilesubscription-8b2c9",
  storageBucket: "mobilesubscription-8b2c9.firebasestorage.app",
  messagingSenderId: "898486147803",
  appId: "1:898486147803:web:4e6d3b44772c30c8728afe",
  measurementId: "G-8TPFKWWMM5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);