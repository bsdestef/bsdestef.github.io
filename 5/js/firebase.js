// Connects Space Explorer to Firebase. Every other script imports Firebase
// features from this file, so the SDK version and project settings live in one place.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

// These values identify our Firebase project. They are meant to be public:
// the database security rules (not this key) decide who can read and write data.
const firebaseConfig = {
    apiKey: "AIzaSyBfNDr9Gz_WpPu8RorB5CN1N0J-nAm_vfQ",
    authDomain: "space-explorer-47ca4.firebaseapp.com",
    databaseURL: "https://space-explorer-47ca4-default-rtdb.firebaseio.com",
    projectId: "space-explorer-47ca4",
    storageBucket: "space-explorer-47ca4.firebasestorage.app",
    messagingSenderId: "666402554715",
    appId: "1:666402554715:web:8ec5b4ab856e41fb98107e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

// Firebase Authentication: sign up, log in, log out, and change password.
export {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Firebase Realtime Database: read the space data and save Contact Us messages.
export {
    ref,
    get,
    push,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
