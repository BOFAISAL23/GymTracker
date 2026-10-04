import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByGWTLIPgIuOzMkVHHUHyR2jz-y6aAdCc",
  authDomain: "gym-tracker-38c81.firebaseapp.com",
  projectId: "gym-tracker-38c81",
  storageBucket: "gym-tracker-38c81.firebasestorage.app",
  messagingSenderId: "45763112324",
  appId: "1:45763112324:web:41653392bfd1941e81c1d1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;