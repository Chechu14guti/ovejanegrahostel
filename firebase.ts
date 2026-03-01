// firebase.ts
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBj3at_t71t-rxeq_3A4qnwV__JqHXoIU0",
  authDomain: "onhostel-f8bb9.firebaseapp.com",
  projectId: "onhostel-f8bb9",
  storageBucket: "onhostel-f8bb9.firebasestorage.app",
  messagingSenderId: "318544027632",
  appId: "1:318544027632:web:354df3ed48f52d43384735",
  measurementId: "G-V4NJM5ZS18"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 👉 ESTA ES LA EXPORTACIÓN QUE USAMOS EN EL RESTO
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const auth = getAuth(app);