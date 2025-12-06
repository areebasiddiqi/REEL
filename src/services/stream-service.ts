// Service to handle livestream viewer tracking and streaming

import { db } from '@/lib/firebase.config';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export const streamService = {
    // Get current stream status
    getStreamStatus: async (livestreamId: string) => {
        try {
            const docRef = doc(db, 'livestreams', livestreamId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Stream not found');
            }

            return docSnap.data();
        } catch (error) {
            console.error('Error getting stream status:', error);
            throw error;
        }
    },

    // Increment viewer count when viewer joins
    addViewer: async (livestreamId: string) => {
        try {
            const docRef = doc(db, 'livestreams', livestreamId);
            await updateDoc(docRef, {
                viewerCount: increment(1)
            });

            const updatedDoc = await getDoc(docRef);
            const data = updatedDoc.data();
            console.log(`Viewer added. Total viewers: ${data?.viewerCount}`);
            return data;
        } catch (error) {
            console.error('Error adding viewer:', error);
            // Don't throw for viewer count updates to avoid disrupting the UX
            return null;
        }
    },

    // Decrement viewer count when viewer leaves
    removeViewer: async (livestreamId: string) => {
        try {
            const docRef = doc(db, 'livestreams', livestreamId);
            await updateDoc(docRef, {
                viewerCount: increment(-1)
            });

            const updatedDoc = await getDoc(docRef);
            const data = updatedDoc.data();
            console.log(`Viewer removed. Total viewers: ${data?.viewerCount}`);
            return data;
        } catch (error) {
            console.error('Error removing viewer:', error);
            return null;
        }
    },

    // Poll for updated viewer count
    pollViewerCount: async (livestreamId: string) => {
        try {
            const docRef = doc(db, 'livestreams', livestreamId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return 0;
            }

            return docSnap.data()?.viewerCount || 0;
        } catch (error) {
            console.error('Error polling viewer count:', error);
            return 0;
        }
    },
};
