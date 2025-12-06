import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { FriendRequest } from '@/types';

// Send friend request
export const sendFriendRequest = async (
    fromUserId: string,
    fromUserName: string,
    fromUserPhoto: string | undefined,
    toUserId: string
): Promise<void> => {
    try {
        // Check if request already exists
        const existingRequest = await getDoc(
            doc(db, 'users', toUserId, 'friendRequests', fromUserId)
        );

        if (existingRequest.exists()) {
            throw new Error('Friend request already sent');
        }

        // Check if already friends
        const friendDoc = await getDoc(doc(db, 'users', fromUserId, 'friends', toUserId));
        if (friendDoc.exists()) {
            throw new Error('Already friends');
        }

        // Create friend request
        await setDoc(doc(db, 'users', toUserId, 'friendRequests', fromUserId), {
            id: fromUserId,
            fromUserId,
            fromUserName,
            fromUserPhoto: fromUserPhoto || '',
            toUserId,
            status: 'pending',
            createdAt: Timestamp.fromDate(new Date()),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to send friend request');
    }
};

// Accept friend request
export const acceptFriendRequest = async (
    userId: string,
    requestId: string
): Promise<void> => {
    try {
        const requestRef = doc(db, 'users', userId, 'friendRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            throw new Error('Friend request not found');
        }

        const request = requestDoc.data();

        // Add to both users' friends lists
        await setDoc(doc(db, 'users', userId, 'friends', requestId), {
            userId: requestId,
            addedAt: Timestamp.fromDate(new Date()),
        });

        await setDoc(doc(db, 'users', requestId, 'friends', userId), {
            userId: userId,
            addedAt: Timestamp.fromDate(new Date()),
        });

        // Delete the friend request
        await deleteDoc(requestRef);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to accept friend request');
    }
};

// Reject friend request
export const rejectFriendRequest = async (
    userId: string,
    requestId: string
): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'friendRequests', requestId));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to reject friend request');
    }
};

// Get pending friend requests
export const getPendingRequests = async (userId: string): Promise<FriendRequest[]> => {
    try {
        const querySnapshot = await getDocs(
            collection(db, 'users', userId, 'friendRequests')
        );

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
            } as FriendRequest;
        });
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return [];
    }
};

// Get user's friends list
export const getFriends = async (userId: string): Promise<string[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'friends'));
        return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Error fetching friends:', error);
        return [];
    }
};

// Check if users are friends
export const areFriends = async (userId1: string, userId2: string): Promise<boolean> => {
    try {
        const friendDoc = await getDoc(doc(db, 'users', userId1, 'friends', userId2));
        return friendDoc.exists();
    } catch (error) {
        console.error('Error checking friendship:', error);
        return false;
    }
};

// Check if friend request exists
export const hasPendingRequest = async (
    fromUserId: string,
    toUserId: string
): Promise<boolean> => {
    try {
        const requestDoc = await getDoc(
            doc(db, 'users', toUserId, 'friendRequests', fromUserId)
        );
        return requestDoc.exists();
    } catch (error) {
        console.error('Error checking request:', error);
        return false;
    }
};

// Remove friend
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'friends', friendId));
        await deleteDoc(doc(db, 'users', friendId, 'friends', userId));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to remove friend');
    }
};
