import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    UploadTask,
} from 'firebase/storage';
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
    increment,
    Timestamp,
} from 'firebase/firestore';
import { storage, db } from '@/lib/firebase.config';
import { Video } from '@/types';

// Upload video to Firebase Storage
export const uploadVideo = (
    file: File,
    userId: string,
    onProgress: (progress: number) => void
): UploadTask => {
    const timestamp = Date.now();
    const fileName = `videos/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
    });

    return uploadTask;
};

// Create video metadata in Firestore
export const createVideo = async (
    videoData: Omit<Video, 'id' | 'views' | 'likes' | 'uploadedAt' | 'status'>
): Promise<string> => {
    try {
        const videoRef = doc(collection(db, 'videos'));

        const video = {
            ...videoData,
            views: 0,
            likes: 0,
            uploadedAt: Timestamp.fromDate(new Date()),
            status: 'ready',
        };

        await setDoc(videoRef, video);

        return videoRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create video');
    }
};

// Get video by ID
export const getVideo = async (videoId: string): Promise<Video | null> => {
    try {
        const videoDoc = await getDoc(doc(db, 'videos', videoId));

        if (!videoDoc.exists()) {
            return null;
        }

        const data = videoDoc.data();
        return {
            id: videoDoc.id,
            ...data,
            uploadedAt: data.uploadedAt.toDate(),
        } as Video;
    } catch (error) {
        console.error('Error fetching video:', error);
        return null;
    }
};

// Get all public videos
export const getPublicVideos = async (): Promise<Video[]> => {
    try {
        const q = query(
            collection(db, 'videos'),
            where('privacy', '==', 'public'),
            where('status', '==', 'ready'),
            orderBy('uploadedAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                uploadedAt: data.uploadedAt.toDate(),
            } as Video;
        });
    } catch (error) {
        console.error('Error fetching videos:', error);
        return [];
    }
};

// Get user videos
export const getUserVideos = async (userId: string): Promise<Video[]> => {
    try {
        const q = query(
            collection(db, 'videos'),
            where('creatorId', '==', userId),
            orderBy('uploadedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                uploadedAt: data.uploadedAt.toDate(),
            } as Video;
        });
    } catch (error) {
        console.error('Error fetching user videos:', error);
        return [];
    }
};

// Increment video views
export const incrementVideoViews = async (videoId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'videos', videoId), {
            views: increment(1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to increment views');
    }
};

// Like video
export const likeVideo = async (videoId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'videos', videoId), {
            likes: increment(1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to like video');
    }
};
