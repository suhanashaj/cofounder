import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCAOxJBEKVPR3DpFSr8QjaTmKPES1j48ac",
  authDomain: "try-cfproject.firebaseapp.com",
  databaseURL: "https://try-cfproject-default-rtdb.firebaseio.com",
  projectId: "try-cfproject",
  storageBucket: "try-cfproject.firebasestorage.app",
  messagingSenderId: "109517756184",
  appId: "1:109517756184:web:1dba6390f904b49549306d"
};
const app = initializeApp(firebaseConfig);

// ✅ NAMED EXPORTS (important)
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
