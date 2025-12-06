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
import { Challenge, ChallengeSubmission } from '@/types';
import { awardPoints } from './points-service';

// Upload challenge thumbnail
export const uploadChallengeThumbnail = (
    file: File,
    userId: string,
    onProgress: (progress: number) => void
): UploadTask => {
    const timestamp = Date.now();
    const fileName = `challenges/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
    });

    return uploadTask;
};

// Create a new challenge
export const createChallenge = async (
    challengeData: Omit<Challenge, 'id' | 'participants' | 'completions'>
): Promise<string> => {
    try {
        const challengeRef = doc(collection(db, 'challenges'));

        const challenge = {
            ...challengeData,
            participants: 0,
            completions: 0,
            startDate: Timestamp.fromDate(challengeData.startDate),
            endDate: Timestamp.fromDate(challengeData.endDate),
        };

        await setDoc(challengeRef, challenge);

        return challengeRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create challenge');
    }
};

// Get challenge by ID
export const getChallenge = async (challengeId: string): Promise<Challenge | null> => {
    try {
        const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));

        if (!challengeDoc.exists()) {
            return null;
        }

        const data = challengeDoc.data();
        return {
            id: challengeDoc.id,
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
        } as Challenge;
    } catch (error) {
        console.error('Error fetching challenge:', error);
        return null;
    }
};

// Get all challenges with filtering
export const getAllChallenges = async (
    status?: 'active' | 'ended' | 'all'
): Promise<Challenge[]> => {
    try {
        let q;

        if (status && status !== 'all') {
            q = query(
                collection(db, 'challenges'),
                where('status', '==', status),
                orderBy('startDate', 'desc'),
                limit(50)
            );
        } else {
            q = query(
                collection(db, 'challenges'),
                orderBy('startDate', 'desc'),
                limit(50)
            );
        }

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate.toDate(),
                endDate: data.endDate.toDate(),
            } as Challenge;
        });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        return [];
    }
};

// Get user's challenges (created by user)
export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
    try {
        const q = query(
            collection(db, 'challenges'),
            where('creatorId', '==', userId),
            orderBy('startDate', 'desc')
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate.toDate(),
                endDate: data.endDate.toDate(),
            } as Challenge;
        });
    } catch (error) {
        console.error('Error fetching user challenges:', error);
        return [];
    }
};

// Submit challenge entry
export const submitChallengeEntry = async (
    challengeId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    submissionUrl: string,
    description: string
): Promise<string> => {
    try {
        const submissionRef = doc(collection(db, 'challenges', challengeId, 'submissions'));

        await setDoc(submissionRef, {
            id: submissionRef.id,
            challengeId,
            userId,
            userName,
            userPhoto,
            submissionUrl,
            description,
            submittedAt: Timestamp.fromDate(new Date()),
            status: 'pending',
            likes: 0,
        });

        // Increment participants count
        await updateDoc(doc(db, 'challenges', challengeId), {
            participants: increment(1),
        });

        return submissionRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to submit challenge entry');
    }
};

// Get challenge submissions
export const getChallengeSubmissions = async (
    challengeId: string,
    statusFilter?: 'pending' | 'approved' | 'rejected' | 'all'
): Promise<ChallengeSubmission[]> => {
    try {
        let q;

        if (statusFilter && statusFilter !== 'all') {
            q = query(
                collection(db, 'challenges', challengeId, 'submissions'),
                where('status', '==', statusFilter),
                orderBy('submittedAt', 'desc'),
                limit(100)
            );
        } else {
            q = query(
                collection(db, 'challenges', challengeId, 'submissions'),
                orderBy('submittedAt', 'desc'),
                limit(100)
            );
        }

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt.toDate(),
            } as ChallengeSubmission;
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
};

// Approve submission and award points
export const approveSubmission = async (
    challengeId: string,
    submissionId: string
): Promise<void> => {
    try {
        const submissionRef = doc(db, 'challenges', challengeId, 'submissions', submissionId);
        const submissionDoc = await getDoc(submissionRef);

        if (!submissionDoc.exists()) {
            throw new Error('Submission not found');
        }

        const submission = submissionDoc.data();

        // Update submission status
        await updateDoc(submissionRef, {
            status: 'approved',
        });

        // Get challenge to know points reward
        const challenge = await getChallenge(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        // Award points to user
        await awardPoints(
            submission.userId,
            challenge.pointsReward,
            `Completed challenge: ${challenge.title}`,
            challengeId
        );

        // Increment completions count
        await updateDoc(doc(db, 'challenges', challengeId), {
            completions: increment(1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to approve submission');
    }
};

// Reject submission
export const rejectSubmission = async (
    challengeId: string,
    submissionId: string
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'challenges', challengeId, 'submissions', submissionId), {
            status: 'rejected',
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to reject submission');
    }
};

// Like a submission
export const likeSubmission = async (
    challengeId: string,
    submissionId: string
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'challenges', challengeId, 'submissions', submissionId), {
            likes: increment(1),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to like submission');
    }
};
