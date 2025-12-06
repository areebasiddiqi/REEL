import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    signOut,
    User as FirebaseUser,
    updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase.config';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { User } from '@/types';

// Initialize OAuth providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Convert Firebase User to User type
const firebaseUserToUser = (firebaseUser: FirebaseUser): User => {
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        role: 'viewer',
        followers: 0,
        following: 0,
        points: 0,
        createdAt: new Date(),
    };
};

// Email/Password Sign Up
export const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update profile with display name
        await updateProfile(firebaseUser, { displayName });

        // Create user document in Firestore
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: displayName,
            photoURL: firebaseUser.photoURL || '',
            role: 'viewer',
            followers: 0,
            following: 0,
            points: 0,
            createdAt: Timestamp.fromDate(new Date()),
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);

        // Return user object
        return firebaseUserToUser(firebaseUser);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign up');
    }
};

// Email/Password Sign In
export const signInWithEmail = async (
    email: string,
    password: string
): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Check if user document exists in Firestore, create if not
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || 'User',
                photoURL: firebaseUser.photoURL || '',
                role: 'viewer',
                followers: 0,
                following: 0,
                points: 0,
                createdAt: Timestamp.fromDate(new Date()),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        }

        // Return user object from Firebase Auth
        return firebaseUserToUser(firebaseUser);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign in');
    }
};

// Google Sign In
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;

        // Check if user document exists in Firestore, create if not
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || 'User',
                photoURL: firebaseUser.photoURL || '',
                role: 'viewer',
                followers: 0,
                following: 0,
                points: 0,
                createdAt: Timestamp.fromDate(new Date()),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        }

        // Return user object from Firebase Auth
        return firebaseUserToUser(firebaseUser);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign in with Google');
    }
};

// Apple Sign In
export const signInWithApple = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, appleProvider);
        const firebaseUser = result.user;

        // Check if user document exists in Firestore, create if not
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || 'User',
                photoURL: firebaseUser.photoURL || '',
                role: 'viewer',
                followers: 0,
                following: 0,
                points: 0,
                createdAt: Timestamp.fromDate(new Date()),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        }

        // Return user object from Firebase Auth
        return firebaseUserToUser(firebaseUser);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign in with Apple');
    }
};

// Sign Out
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign out');
    }
};

// Get User Data from Firebase Auth
export const getUserData = async (uid: string): Promise<User | null> => {
    try {
        // Get current user from Firebase Auth
        const currentUser = auth.currentUser;

        if (!currentUser || currentUser.uid !== uid) {
            return null;
        }

        return firebaseUserToUser(currentUser);
    } catch (error: any) {
        console.warn('Error fetching user data:', error);
        return null;
    }
};

// Update User Profile
export const updateUserProfile = async (
    uid: string,
    updates: Partial<User>
): Promise<void> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser || currentUser.uid !== uid) {
            throw new Error('User not authenticated');
        }

        // Update Firebase Auth profile
        if (updates.displayName || updates.photoURL) {
            await updateProfile(currentUser, {
                displayName: updates.displayName || currentUser.displayName || undefined,
                photoURL: updates.photoURL || currentUser.photoURL || undefined,
            });
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update profile');
    }
};
