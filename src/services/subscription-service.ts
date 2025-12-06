import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { CreatorSubscription, UserSubscription } from '@/types';

// Create Creator Subscription Offering
export const createCreatorSubscription = async (
    creatorId: string,
    creatorName: string,
    price: number, // Price in cents
    description: string,
    benefits: string[]
): Promise<void> => {
    try {
        const subscriptionData: Omit<CreatorSubscription, 'id'> = {
            creatorId,
            creatorName,
            price,
            description,
            benefits,
            subscriberCount: 0,
            active: true,
            createdAt: new Date(),
        };

        await setDoc(doc(db, 'creatorSubscriptions', creatorId), {
            ...subscriptionData,
            id: creatorId,
            createdAt: Timestamp.fromDate(subscriptionData.createdAt),
        });
    } catch (error: any) {
        console.error('Error creating creator subscription:', error);
        throw new Error(error.message || 'Failed to create subscription');
    }
};

// Update Creator Subscription
export const updateCreatorSubscription = async (
    creatorId: string,
    updates: Partial<Omit<CreatorSubscription, 'id' | 'creatorId' | 'subscriberCount' | 'createdAt'>>
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'creatorSubscriptions', creatorId), updates);
    } catch (error: any) {
        console.error('Error updating creator subscription:', error);
        throw new Error(error.message || 'Failed to update subscription');
    }
};

// Get Creator Subscription
export const getCreatorSubscription = async (
    creatorId: string
): Promise<CreatorSubscription | null> => {
    try {
        const docSnap = await getDoc(doc(db, 'creatorSubscriptions', creatorId));

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            ...data,
            createdAt: data.createdAt.toDate(),
        } as CreatorSubscription;
    } catch (error: any) {
        console.error('Error fetching creator subscription:', error);
        return null;
    }
};

// Subscribe User to Creator
export const subscribeUserToCreator = async (
    userId: string,
    creatorId: string,
    subscriptionId: string
): Promise<void> => {
    try {
        const subscription: Omit<UserSubscription, 'id'> = {
            userId,
            creatorId,
            subscriptionId,
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: new Date(),
        };

        await setDoc(doc(db, 'users', userId, 'subscriptions', creatorId), {
            ...subscription,
            id: creatorId,
            currentPeriodEnd: Timestamp.fromDate(subscription.currentPeriodEnd),
            createdAt: Timestamp.fromDate(subscription.createdAt),
        });

        // Increment subscriber count
        const creatorSubRef = doc(db, 'creatorSubscriptions', creatorId);
        const creatorSubDoc = await getDoc(creatorSubRef);
        if (creatorSubDoc.exists()) {
            await updateDoc(creatorSubRef, {
                subscriberCount: (creatorSubDoc.data().subscriberCount || 0) + 1,
            });
        }
    } catch (error: any) {
        console.error('Error subscribing user:', error);
        throw new Error(error.message || 'Failed to subscribe');
    }
};

// Unsubscribe User from Creator
export const unsubscribeUserFromCreator = async (
    userId: string,
    creatorId: string
): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'subscriptions', creatorId));

        // Decrement subscriber count
        const creatorSubRef = doc(db, 'creatorSubscriptions', creatorId);
        const creatorSubDoc = await getDoc(creatorSubRef);
        if (creatorSubDoc.exists()) {
            await updateDoc(creatorSubRef, {
                subscriberCount: Math.max(0, (creatorSubDoc.data().subscriberCount || 0) - 1),
            });
        }
    } catch (error: any) {
        console.error('Error unsubscribing user:', error);
        throw new Error(error.message || 'Failed to unsubscribe');
    }
};

// Get User's Subscriptions
export const getUserSubscriptions = async (
    userId: string
): Promise<UserSubscription[]> => {
    try {
        const querySnapshot = await getDocs(
            collection(db, 'users', userId, 'subscriptions')
        );

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                currentPeriodEnd: data.currentPeriodEnd.toDate(),
                createdAt: data.createdAt.toDate(),
            } as UserSubscription;
        });
    } catch (error: any) {
        console.error('Error fetching user subscriptions:', error);
        return [];
    }
};

// Check if User is Subscribed to Creator
export const isSubscribedTo = async (
    userId: string,
    creatorId: string
): Promise<boolean> => {
    try {
        const docSnap = await getDoc(
            doc(db, 'users', userId, 'subscriptions', creatorId)
        );

        if (!docSnap.exists()) {
            return false;
        }

        const data = docSnap.data();
        return data.status === 'active';
    } catch (error: any) {
        console.error('Error checking subscription:', error);
        return false;
    }
};

// Check if User Can Access Video
export const canAccessVideo = async (
    userId: string | undefined,
    video: { requiresSubscription?: boolean; creatorId: string; privacy: string }
): Promise<boolean> => {
    try {
        // Public videos are always accessible
        if (video.privacy === 'public' && !video.requiresSubscription) {
            return true;
        }

        // Must be logged in for restricted content
        if (!userId) {
            return false;
        }

        // Creator can always access their own videos
        if (userId === video.creatorId) {
            return true;
        }

        // Check if video requires subscription
        if (video.requiresSubscription) {
            return await isSubscribedTo(userId, video.creatorId);
        }

        return true;
    } catch (error: any) {
        console.error('Error checking video access:', error);
        return false;
    }
};
