import {
    doc,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { User } from '@/types';

// Get user profile by ID
export const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return null;
        }

        const data = userDoc.data();
        return {
            uid: userDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            followers: data.followers || 0,
            following: data.following || 0,
            points: data.points || 0,
        } as User;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};
