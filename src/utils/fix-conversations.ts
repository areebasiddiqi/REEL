// This is a one-time migration script to fix existing conversations
// Run this in your browser console on the /messages page

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.config';

export const fixConversations = async () => {
    try {
        const conversationsSnapshot = await getDocs(collection(db, 'conversations'));

        console.log('Found conversations:', conversationsSnapshot.docs.length);

        for (const convDoc of conversationsSnapshot.docs) {
            const data = convDoc.data();
            const conversationId = convDoc.id;

            console.log('Checking conversation:', conversationId);

            // Check if participants field exists
            if (!data.participants) {
                console.log('Missing participants field, fixing...');

                // Extract user IDs from conversation ID (format: userId1_userId2)
                const userIds = conversationId.split('_');

                if (userIds.length === 2) {
                    await updateDoc(doc(db, 'conversations', conversationId), {
                        participants: userIds,
                        participantNames: data.participantNames || {},
                        participantPhotos: data.participantPhotos || {},
                        lastMessage: data.lastMessage || '',
                        lastMessageAt: data.lastMessageAt || new Date(),
                        unreadCount: data.unreadCount || {
                            [userIds[0]]: 0,
                            [userIds[1]]: 0,
                        },
                    });

                    console.log('Fixed conversation:', conversationId);
                } else {
                    console.error('Invalid conversation ID format:', conversationId);
                }
            } else {
                console.log('Conversation already has participants field');
            }
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Error fixing conversations:', error);
    }
};

// To run: fixConversations();
