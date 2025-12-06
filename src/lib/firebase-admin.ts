import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

// Initialize Firebase Admin
if (!getApps().length) {
    // For local development, you can use service account key
    // For production (Vercel, etc.), use environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'reeltalk-new-95731376-d55e7',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    });
} else {
    adminApp = getApps()[0];
}

adminDb = getFirestore(adminApp);
adminDb.settings({ databaseId: 'reeltalk' });

export { adminDb };
export default adminApp;
