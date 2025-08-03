// firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDB0ToMS7hEql3rCIUyRCde4KJJj0zMsUo",
  authDomain: "restaurent-5d9ad.firebaseapp.com",
  projectId: "restaurent-5d9ad",
  storageBucket: "restaurent-5d9ad.firebasestorage.app",
  messagingSenderId: "978143899585",
  appId: "1:978143899585:web:6b4f042735d599c03b0940",
  measurementId: "G-GBT08VVBST"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
