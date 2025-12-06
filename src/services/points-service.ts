import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    increment,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { PointsTransaction } from '@/types';

// Get user's total points
export const getUserPoints = async (userId: string): Promise<number> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return 0;
        }

        return userDoc.data().points || 0;
    } catch (error) {
        console.error('Error fetching user points:', error);
        return 0;
    }
};

// Award points to user
export const awardPoints = async (
    userId: string,
    points: number,
    reason: string,
    relatedId?: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            // Create user document with initial points if it doesn't exist
            await setDoc(userRef, {
                points: points,
            }, { merge: true });
        } else {
            // Update existing user's points
            await updateDoc(userRef, {
                points: increment(points),
            });
        }

        // Create points transaction record
        const transactionRef = doc(collection(db, 'users', userId, 'pointsHistory'));
        await setDoc(transactionRef, {
            id: transactionRef.id,
            userId,
            points,
            reason,
            type: 'earned',
            relatedId,
            createdAt: Timestamp.fromDate(new Date()),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to award points');
    }
};

// Deduct points from user
export const deductPoints = async (
    userId: string,
    points: number,
    reason: string,
    relatedId?: string
): Promise<void> => {
    try {
        // Update user's total points
        await updateDoc(doc(db, 'users', userId), {
            points: increment(-points),
        });

        // Create points transaction record
        const transactionRef = doc(collection(db, 'users', userId, 'pointsHistory'));
        await setDoc(transactionRef, {
            id: transactionRef.id,
            userId,
            points,
            reason,
            type: 'spent',
            relatedId,
            createdAt: Timestamp.fromDate(new Date()),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to deduct points');
    }
};

// Get leaderboard (top users by points)
export const getLeaderboard = async (limitCount: number = 50): Promise<any[]> => {
    try {
        const q = query(
            collection(db, 'users'),
            orderBy('points', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        }));
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

// Get user's points history
export const getUserPointsHistory = async (userId: string): Promise<PointsTransaction[]> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'pointsHistory'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
            } as PointsTransaction;
        });
    } catch (error) {
        console.error('Error fetching points history:', error);
        return [];
    }
};
