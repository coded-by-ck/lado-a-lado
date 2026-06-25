import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDNWWG7nPI7EXyuMlJmiHbeHAX6EXABWqQ",
  authDomain: "barbearia-lado-a-lado.firebaseapp.com",
  projectId: "barbearia-lado-a-lado",
  storageBucket: "barbearia-lado-a-lado.firebasestorage.app",
  messagingSenderId: "477542764196",
  appId: "1:477542764196:web:691facb65d22e2f214a031"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const functions = getFunctions(app);
