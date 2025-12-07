import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { createNotification } from './notification-service';

// Follow a creator
export const followCreator = async (userId: string, creatorId: string, userName?: string): Promise<void> => {
    try {
        // Add to user's following list
        await setDoc(doc(db, 'users', userId, 'following', creatorId), {
            creatorId,
            followedAt: new Date(),
        });

        // Add to creator's followers list
        await setDoc(doc(db, 'users', creatorId, 'followers', userId), {
            userId,
            followedAt: new Date(),
        });

        // Increment counts
        await updateDoc(doc(db, 'users', userId), {
            following: increment(1),
        });

        await updateDoc(doc(db, 'users', creatorId), {
            followers: increment(1),
        });

        // Create notification for the creator
        const followerName = userName || 'A user';
        await createNotification(
            creatorId,
            'follow',
            'New Follower',
            `${followerName} started following you`,
            `/profile/${userId}`
        );
    } catch (error: any) {
        throw new Error(error.message || 'Failed to follow creator');
    }
};

// Unfollow a creator
export const unfollowCreator = async (userId: string, creatorId: string): Promise<void> => {
    try {
        // Remove from user's following list
        await deleteDoc(doc(db, 'users', userId, 'following', creatorId));

        // Remove from creator's followers list
        await deleteDoc(doc(db, 'users', creatorId, 'followers', userId));

        // Decrement counts
        await updateDoc(doc(db, 'users', userId), {
            following: increment(-1),
        });

        await updateDoc(doc(db, 'users', creatorId), {
            followers: increment(-1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to unfollow creator');
    }
};

// Check if user is following a creator
export const isFollowing = async (userId: string, creatorId: string): Promise<boolean> => {
    try {
        const followDoc = await getDoc(doc(db, 'users', userId, 'following', creatorId));
        return followDoc.exists();
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
};

// Get all creators (all users sorted by followers)
export const getAllCreators = async (excludeUserId?: string): Promise<any[]> => {
    try {
        console.log('Fetching all creators, excluding:', excludeUserId);

        const querySnapshot = await getDocs(collection(db, 'users'));
        console.log('Total users fetched:', querySnapshot.docs.length);

        const users = querySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    displayName: data.displayName || data.email || 'Anonymous User',
                    email: data.email,
                    photoURL: data.photoURL,
                    bio: data.bio,
                    role: data.role,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    followers: data.followers || 0,
                    following: data.following || 0,
                    points: data.points || 0,
                };
            })
            .filter(user => user.uid !== excludeUserId); // Exclude current user

        // Sort by followers on the client side
        return users.sort((a, b) => b.followers - a.followers);
    } catch (error) {
        console.error('Error fetching creators:', error);
        return [];
    }
};

// Get user's following list
export const getFollowing = async (userId: string): Promise<string[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'following'));
        return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Error fetching following:', error);
        return [];
    }
};
