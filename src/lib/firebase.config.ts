import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {

    apiKey: "AIzaSyBcoC_uig3DzIs6jhxDEYp8acDteTCxVBY",

    authDomain: "reeltalk-new-95731376-d55e7.firebaseapp.com",

    projectId: "reeltalk-new-95731376-d55e7",

    storageBucket: "reeltalk-new-95731376-d55e7.firebasestorage.app",

    messagingSenderId: "1033221896864",

    appId: "1:1033221896864:web:edaaf94df14f8db76227c5",

    measurementId: "G-BNDZEYQX7T"

};


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, 'reeltalk');
export const storage: FirebaseStorage = getStorage(app);

export default app;
