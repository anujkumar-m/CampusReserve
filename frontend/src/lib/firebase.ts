import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyA0dVzuKgcIodC1JTFMX8LGQIEK1vVvY54",
    authDomain: "campusreserve-8b144.firebaseapp.com",
    projectId: "campusreserve-8b144",
    storageBucket: "campusreserve-8b144.firebasestorage.app",
    messagingSenderId: "474590523122",
    appId: "1:474590523122:web:49dd9a13961ac970d1aa6b",
    measurementId: "G-ZFGLGC6FS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
