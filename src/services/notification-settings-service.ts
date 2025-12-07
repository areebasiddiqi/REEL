import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';

export interface NotificationSettings {
    userId: string;
    follow: boolean;
    like: boolean;
    comment: boolean;
    challenge: boolean;
    payment: boolean;
    email: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Get notification settings for a user
export const getNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
    try {
        const settingsDoc = await getDoc(doc(db, 'notificationSettings', userId));

        if (!settingsDoc.exists()) {
            // Return default settings if none exist
            return {
                userId,
                follow: true,
                like: true,
                comment: true,
                challenge: true,
                payment: true,
                email: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        const data = settingsDoc.data();
        return {
            userId,
            follow: data.follow ?? true,
            like: data.like ?? true,
            comment: data.comment ?? true,
            challenge: data.challenge ?? true,
            payment: data.payment ?? true,
            email: data.email ?? false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        };
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        // Return default settings on error
        return {
            userId,
            follow: true,
            like: true,
            comment: true,
            challenge: true,
            payment: true,
            email: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
};

// Update notification settings
export const updateNotificationSettings = async (
    userId: string,
    settings: Partial<NotificationSettings>
): Promise<void> => {
    try {
        const settingsRef = doc(db, 'notificationSettings', userId);
        
        await setDoc(
            settingsRef,
            {
                userId,
                follow: settings.follow ?? true,
                like: settings.like ?? true,
                comment: settings.comment ?? true,
                challenge: settings.challenge ?? true,
                payment: settings.payment ?? true,
                email: settings.email ?? false,
                updatedAt: new Date(),
            },
            { merge: true }
        );
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update notification settings');
    }
};

// Toggle a specific notification type
export const toggleNotificationType = async (
    userId: string,
    type: 'follow' | 'like' | 'comment' | 'challenge' | 'payment' | 'email'
): Promise<void> => {
    try {
        const settings = await getNotificationSettings(userId);
        const currentValue = settings[type];
        
        await updateDoc(doc(db, 'notificationSettings', userId), {
            [type]: !currentValue,
            updatedAt: new Date(),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to toggle notification setting');
    }
};

// Check if a notification type is enabled
export const isNotificationTypeEnabled = async (
    userId: string,
    type: 'follow' | 'like' | 'comment' | 'challenge' | 'payment'
): Promise<boolean> => {
    try {
        const settings = await getNotificationSettings(userId);
        return settings[type] ?? true;
    } catch (error) {
        console.error('Error checking notification setting:', error);
        return true; // Default to enabled on error
    }
};
