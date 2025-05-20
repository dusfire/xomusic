// XoFilmy Firebase Configuration

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, startAfter, where, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAe1lFN-bAcd_f-XU-NCVII-mCqh04-lR4",
  authDomain: "xofilmy.firebaseapp.com",
  projectId: "xofilmy",
  storageBucket: "xofilmy.firebasestorage.app",
  messagingSenderId: "744877520454",
  appId: "1:744877520454:web:c18fdbff07606d2dc4fc47",
  measurementId: "G-Y6MSSSZPM8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Export Firebase instances
export { app, analytics, db, storage, auth };