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
    onSnapshot,
    Timestamp,
    increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.config';
import { Conversation, Message } from '@/types';

// Get or create conversation between two users
export const getOrCreateConversation = async (
    userId1: string,
    userName1: string,
    userPhoto1: string | undefined,
    userId2: string,
    userName2: string,
    userPhoto2: string | undefined
): Promise<string> => {
    try {
        console.log('Creating/getting conversation between:', userId1, 'and', userId2);

        // Create consistent conversation ID (sorted user IDs)
        const conversationId = [userId1, userId2].sort().join('_');
        console.log('Conversation ID:', conversationId);

        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);

        if (!conversationDoc.exists()) {
            console.log('Conversation does not exist, creating new one...');

            const conversationData = {
                id: conversationId,
                participants: [userId1, userId2],
                participantNames: {
                    [userId1]: userName1 || 'User',
                    [userId2]: userName2 || 'User',
                },
                participantPhotos: {
                    [userId1]: userPhoto1 || '',
                    [userId2]: userPhoto2 || '',
                },
                lastMessage: '',
                lastMessageAt: Timestamp.fromDate(new Date()),
                unreadCount: {
                    [userId1]: 0,
                    [userId2]: 0,
                },
            };

            console.log('Creating conversation with data:', conversationData);

            // Create new conversation
            await setDoc(conversationRef, conversationData);

            console.log('Conversation created successfully!');

            // Verify it was created
            const verifyDoc = await getDoc(conversationRef);
            console.log('Verification - Document exists:', verifyDoc.exists());
            if (verifyDoc.exists()) {
                console.log('Verification - Document data:', verifyDoc.data());
            }
        } else {
            console.log('Conversation already exists');
        }

        return conversationId;
    } catch (error: any) {
        console.error('Error in getOrCreateConversation:', error);
        throw new Error(error.message || 'Failed to create conversation');
    }
};

// Send message
export const sendMessage = async (
    conversationId: string,
    senderId: string,
    content: string
): Promise<void> => {
    try {
        // Add message to conversation
        const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
        await setDoc(messageRef, {
            id: messageRef.id,
            conversationId,
            senderId,
            content,
            createdAt: Timestamp.fromDate(new Date()),
            read: false,
        });

        // Update conversation metadata
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);

        if (conversationDoc.exists()) {
            const data = conversationDoc.data();
            const otherUserId = data.participants.find((id: string) => id !== senderId);

            await updateDoc(conversationRef, {
                lastMessage: content,
                lastMessageAt: Timestamp.fromDate(new Date()),
                [`unreadCount.${otherUserId}`]: increment(1),
            });
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to send message');
    }
};

// Get user's conversations
export const getConversations = async (userId: string): Promise<Conversation[]> => {
    try {
        console.log('Fetching conversations for user:', userId);

        // Debug: Fetch ALL conversations to see what exists
        const allDocs = await getDocs(collection(db, 'conversations'));
        console.log('Total conversations in DB:', allDocs.docs.length);
        allDocs.docs.forEach(doc => {
            console.log('Conv ID:', doc.id, 'Data:', doc.data());
        });

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', userId)
        );

        const querySnapshot = await getDocs(q);
        console.log('Total conversations found:', querySnapshot.docs.length);

        const conversations = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Conversation data:', doc.id, data);
            return {
                id: doc.id,
                ...data,
                lastMessageAt: data.lastMessageAt?.toDate(),
            } as Conversation;
        });

        // Sort by lastMessageAt on client side
        return conversations.sort((a, b) => {
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
};

// Subscribe to messages in a conversation (real-time)
export const subscribeToMessages = (
    conversationId: string,
    callback: (messages: Message[]) => void
) => {
    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
            } as Message;
        });

        callback(messages);
    });
};

// Mark messages as read
export const markAsRead = async (conversationId: string, userId: string): Promise<void> => {
    try {
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
            [`unreadCount.${userId}`]: 0,
        });
    } catch (error: any) {
        console.error('Error marking as read:', error);
    }
};

// Get conversation by ID
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
    try {
        const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));

        if (!conversationDoc.exists()) {
            return null;
        }

        const data = conversationDoc.data();
        return {
            id: conversationDoc.id,
            ...data,
            lastMessageAt: data.lastMessageAt?.toDate(),
        } as Conversation;
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return null;
    }
};
