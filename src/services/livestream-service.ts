import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    onSnapshot,
    increment,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { Livestream, LivestreamParticipant } from '@/types';

// Create a new livestream
export const createLivestream = async (
    creatorId: string,
    creatorName: string,
    creatorPhoto: string | undefined,
    title: string,
    description: string,
    tags: string[] = [],
    isPremium: boolean = false,
    requiredTier?: 'basic' | 'pro' | 'premium',
    thumbnailUrl?: string
): Promise<string> => {
    try {
        const livestreamRef = doc(collection(db, 'livestreams'));

        const livestream: Omit<Livestream, 'id'> = {
            creatorId,
            creatorName,
            title,
            description,
            status: 'live',
            viewerCount: 0,
            startedAt: new Date(),
            tags,
            isPremium,
            ...(creatorPhoto && { creatorPhoto }),
            ...(requiredTier && { requiredTier }),
            ...(thumbnailUrl && { thumbnailUrl }),
        };

        await setDoc(livestreamRef, {
            ...livestream,
            startedAt: Timestamp.fromDate(livestream.startedAt),
        });

        return livestreamRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create livestream');
    }
};

// Get livestream by ID
export const getLivestream = async (livestreamId: string): Promise<Livestream | null> => {
    try {
        const livestreamDoc = await getDoc(doc(db, 'livestreams', livestreamId));

        if (!livestreamDoc.exists()) {
            return null;
        }

        const data = livestreamDoc.data();
        return {
            id: livestreamDoc.id,
            ...data,
            startedAt: data.startedAt.toDate(),
            endedAt: data.endedAt?.toDate(),
        } as Livestream;
    } catch (error) {
        console.error('Error fetching livestream:', error);
        return null;
    }
};

// Get all livestreams with filtering
export const getAllLivestreams = async (
    status?: 'live' | 'scheduled' | 'ended' | 'all',
    searchQuery?: string
): Promise<Livestream[]> => {
    try {
        let q;

        if (status && status !== 'all') {
            q = query(
                collection(db, 'livestreams'),
                where('status', '==', status),
                orderBy('startedAt', 'desc'),
                limit(50)
            );
        } else {
            q = query(
                collection(db, 'livestreams'),
                orderBy('startedAt', 'desc'),
                limit(50)
            );
        }

        const querySnapshot = await getDocs(q);

        let streams = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startedAt: data.startedAt?.toDate(),
                endedAt: data.endedAt?.toDate(),
            } as Livestream;
        });

        // Client-side search filtering (Firestore doesn't support full-text search natively)
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            streams = streams.filter(stream =>
                stream.title.toLowerCase().includes(lowerQuery) ||
                stream.creatorName.toLowerCase().includes(lowerQuery) ||
                stream.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        return streams;
    } catch (error) {
        console.error('Error fetching livestreams:', error);
        return [];
    }
};

// Get live streams (legacy wrapper)
export const getLiveStreams = async (): Promise<Livestream[]> => {
    return getAllLivestreams('live');
};

// Subscribe to livestream updates
export const subscribeLivestream = (
    livestreamId: string,
    callback: (livestream: Livestream | null) => void
) => {
    return onSnapshot(doc(db, 'livestreams', livestreamId), (doc) => {
        if (!doc.exists()) {
            callback(null);
            return;
        }

        const data = doc.data();
        callback({
            id: doc.id,
            ...data,
            startedAt: data.startedAt.toDate(),
            endedAt: data.endedAt?.toDate(),
        } as Livestream);
    });
};

// End livestream
export const endLivestream = async (livestreamId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'livestreams', livestreamId), {
            status: 'ended',
            endedAt: Timestamp.fromDate(new Date()),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to end livestream');
    }
};

// Join livestream (increment viewer count)
export const joinLivestream = async (
    livestreamId: string,
    userId: string,
    userName: string
): Promise<void> => {
    try {
        // Add participant
        await setDoc(doc(db, 'livestreams', livestreamId, 'participants', userId), {
            userId,
            userName,
            joinedAt: Timestamp.fromDate(new Date()),
        });

        // Increment viewer count
        await updateDoc(doc(db, 'livestreams', livestreamId), {
            viewerCount: increment(1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to join livestream');
    }
};

// Leave livestream (decrement viewer count)
export const leaveLivestream = async (
    livestreamId: string,
    userId: string
): Promise<void> => {
    try {
        // Remove participant
        await deleteDoc(doc(db, 'livestreams', livestreamId, 'participants', userId));

        // Decrement viewer count
        await updateDoc(doc(db, 'livestreams', livestreamId), {
            viewerCount: increment(-1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to leave livestream');
    }
};

// Get livestream participants
export const getLivestreamParticipants = async (
    livestreamId: string
): Promise<LivestreamParticipant[]> => {
    try {
        const participantsSnapshot = await getDocs(
            collection(db, 'livestreams', livestreamId, 'participants')
        );

        return participantsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                joinedAt: data.joinedAt.toDate(),
            } as LivestreamParticipant;
        });
    } catch (error) {
        console.error('Error fetching participants:', error);
        return [];
    }
};
