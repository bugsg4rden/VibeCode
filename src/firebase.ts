// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRcYXCcYdJCR0UDLPAysPhI5cj-lwPR7I",
  authDomain: "refsearch-29def.firebaseapp.com",
  projectId: "refsearch-29def",
  storageBucket: "refsearch-29def.firebasestorage.app",
  messagingSenderId: "682119351926",
  appId: "1:682119351926:web:4b42855aba3a3bbb3b9957",
  measurementId: "G-RB0YFBMFKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);
