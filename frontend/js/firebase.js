// Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
