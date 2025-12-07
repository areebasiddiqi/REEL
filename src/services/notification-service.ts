import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    onSnapshot,
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { Notification } from '@/types';

// Create a notification
export const createNotification = async (
    userId: string,
    type: 'follow' | 'like' | 'comment' | 'challenge' | 'payment',
    title: string,
    message: string,
    link?: string
): Promise<string> => {
    try {
        // Check if user has this notification type enabled
        const settingsDoc = await getDoc(doc(db, 'notificationSettings', userId));
        const settings = settingsDoc.data();

        // If settings exist and this type is disabled, don't create notification
        if (settings && settings[type] === false) {
            console.log(`Notification type "${type}" is disabled for user ${userId}`);
            return '';
        }

        const notificationRef = doc(collection(db, 'users', userId, 'notifications'));

        const notification = {
            id: notificationRef.id,
            userId,
            type,
            title,
            message,
            link: link || '',
            read: false,
            createdAt: Timestamp.fromDate(new Date()),
        };

        await setDoc(notificationRef, notification);

        return notificationRef.id;
    } catch (error: any) {
        console.error('Error creating notification:', error);
        throw new Error(error.message || 'Failed to create notification');
    }
};

// Get user notifications
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                read: data.read,
                createdAt: data.createdAt.toDate(),
            } as Notification;
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, 'users', userId, 'notifications'),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.length;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
};

// Mark notification as read
export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
            read: true,
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to mark notification as read');
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    try {
        const notifications = await getUserNotifications(userId);
        
        for (const notification of notifications) {
            if (!notification.read) {
                await markNotificationAsRead(userId, notification.id);
            }
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to mark all notifications as read');
    }
};

// Delete notification
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to delete notification');
    }
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
) => {
    const q = query(
        collection(db, 'users', userId, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                read: data.read,
                createdAt: data.createdAt.toDate(),
            } as Notification;
        });

        callback(notifications);
    });
};

// Subscribe to unread notifications count
export const subscribeToUnreadCount = (
    userId: string,
    callback: (count: number) => void
) => {
    const q = query(
        collection(db, 'users', userId, 'notifications'),
        where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.length);
    });
};
