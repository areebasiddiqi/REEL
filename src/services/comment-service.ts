import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    increment,
    updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { LivestreamComment, VideoComment } from '@/types';
import { createNotification } from './notification-service';

// Post a comment to a livestream
export const postLivestreamComment = async (
    livestreamId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    content: string,
    creatorId?: string
): Promise<void> => {
    try {
        const commentRef = doc(collection(db, 'livestreams', livestreamId, 'comments'));

        await setDoc(commentRef, {
            id: commentRef.id,
            livestreamId,
            userId,
            userName,
            userPhoto,
            content,
            createdAt: Timestamp.fromDate(new Date()),
            likes: 0,
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to post comment');
    }
};

// Subscribe to livestream comments
export const subscribeLivestreamComments = (
    livestreamId: string,
    callback: (comments: LivestreamComment[]) => void
) => {
    const q = query(
        collection(db, 'livestreams', livestreamId, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate(),
            } as LivestreamComment;
        });

        callback(comments.reverse()); // Reverse to show oldest first
    });
};

// Like a comment
export const likeComment = async (
    livestreamId: string,
    commentId: string
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'livestreams', livestreamId, 'comments', commentId), {
            likes: increment(1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to like comment');
    }
};

// Post a comment to a video
export const postVideoComment = async (
    videoId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    content: string,
    creatorId?: string
): Promise<void> => {
    try {
        const commentRef = doc(collection(db, 'videos', videoId, 'comments'));

        await setDoc(commentRef, {
            id: commentRef.id,
            videoId,
            userId,
            userName,
            userPhoto,
            content,
            createdAt: Timestamp.fromDate(new Date()),
            likes: 0,
        });

        // Create notification for the video creator
        if (creatorId && creatorId !== userId) {
            await createNotification(
                creatorId,
                'comment',
                'New Comment',
                `${userName} commented on your video`,
                `/videos/${videoId}`
            );
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to post comment');
    }
};

// Subscribe to video comments
export const subscribeVideoComments = (
    videoId: string,
    callback: (comments: VideoComment[]) => void
) => {
    const q = query(
        collection(db, 'videos', videoId, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate(),
            } as VideoComment;
        });

        callback(comments.reverse()); // Reverse to show oldest first
    });
};
