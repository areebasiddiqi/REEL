import { db } from '@/lib/firebase.config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    increment,
    serverTimestamp,
} from 'firebase/firestore';
import { Livestream, LivestreamComment } from '@/types';

const LIVESTREAMS_COLLECTION = 'livestreams';
const COMMENTS_COLLECTION = 'comments';

// Livestream operations
export const firebaseLivestream = {
    // Get all livestreams
    getAll: async (status?: 'live' | 'scheduled'): Promise<Livestream[]> => {
        try {
            const collectionRef = collection(db, LIVESTREAMS_COLLECTION);
            const q = status 
                ? query(collectionRef, where('status', '==', status))
                : collectionRef;
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.startedAt?.toDate?.() || new Date(),
                } as unknown as Livestream;
            });
        } catch (error) {
            console.error('Error fetching livestreams:', error);
            throw error;
        }
    },

    // Get a specific livestream
    getById: async (id: string): Promise<Livestream | null> => {
        try {
            const docRef = doc(db, LIVESTREAMS_COLLECTION, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            return {
                ...docSnap.data(),
                id: docSnap.id,
                createdAt: docSnap.data().startedAt?.toDate?.() || new Date(),
            } as unknown as Livestream;
        } catch (error) {
            console.error('Error fetching livestream:', error);
            throw error;
        }
    },

    // Create a new livestream
    create: async (data: Omit<Livestream, 'id' | 'createdAt' | 'startedAt'> & { startedAt?: any }): Promise<Livestream> => {
        try {
            const id = `stream_${Date.now()}`;
            const livestreamData = {
                ...data,
                startedAt: serverTimestamp(),
            };

            await setDoc(doc(db, LIVESTREAMS_COLLECTION, id), livestreamData);
            console.log('Firebase: Created livestream', id);

            return {
                ...data,
                id,
                startedAt: new Date(),
                createdAt: new Date(),
            } as unknown as Livestream;
        } catch (error) {
            console.error('Error creating livestream:', error);
            throw error;
        }
    },

    // Update livestream
    update: async (id: string, updates: Partial<Livestream>): Promise<void> => {
        try {
            const docRef = doc(db, LIVESTREAMS_COLLECTION, id);
            await updateDoc(docRef, updates);
            console.log('Firebase: Updated livestream', id);
        } catch (error) {
            console.error('Error updating livestream:', error);
            throw error;
        }
    },

    // Increment viewer count
    addViewer: async (id: string): Promise<number> => {
        try {
            const docRef = doc(db, LIVESTREAMS_COLLECTION, id);
            await updateDoc(docRef, {
                viewerCount: increment(1),
            });
            
            const updated = await getDoc(docRef);
            const newCount = updated.data()?.viewerCount || 0;
            console.log('Firebase: Viewer added. Total:', newCount);
            return newCount;
        } catch (error) {
            console.error('Error adding viewer:', error);
            throw error;
        }
    },

    // Decrement viewer count
    removeViewer: async (id: string): Promise<number> => {
        try {
            const docRef = doc(db, LIVESTREAMS_COLLECTION, id);
            await updateDoc(docRef, {
                viewerCount: increment(-1),
            });
            
            const updated = await getDoc(docRef);
            const newCount = Math.max(0, updated.data()?.viewerCount || 0);
            console.log('Firebase: Viewer removed. Total:', newCount);
            return newCount;
        } catch (error) {
            console.error('Error removing viewer:', error);
            throw error;
        }
    },

    // Delete livestream
    delete: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, LIVESTREAMS_COLLECTION, id));
            console.log('Firebase: Deleted livestream', id);
        } catch (error) {
            console.error('Error deleting livestream:', error);
            throw error;
        }
    },
};

// Comment operations
export const firebaseComment = {
    // Get all comments for a livestream
    getAll: async (livestreamId: string): Promise<LivestreamComment[]> => {
        try {
            const q = query(
                collection(db, COMMENTS_COLLECTION),
                where('livestreamId', '==', livestreamId)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs
                .map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                } as unknown as LivestreamComment))
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    },

    // Add a comment
    add: async (livestreamId: string, data: Omit<LivestreamComment, 'id' | 'createdAt' | 'livestreamId'>): Promise<LivestreamComment> => {
        try {
            const id = `comment_${Date.now()}`;
            const commentData = {
                ...data,
                livestreamId,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, COMMENTS_COLLECTION, id), commentData);
            console.log('Firebase: Added comment', id);

            return {
                ...data,
                id,
                livestreamId,
                createdAt: new Date(),
            };
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },
};
