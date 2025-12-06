'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { getConversation, subscribeToMessages, sendMessage, markAsRead } from '@/services/message-service';
import { Conversation, Message } from '@/types';

export default function ChatPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchConversation = async () => {
            if (!params.id || !user) return;

            const conv = await getConversation(params.id as string);
            setConversation(conv);

            // Mark as read
            if (conv) {
                await markAsRead(params.id as string, user.uid);
            }
        };

        fetchConversation();
    }, [params.id, user]);

    useEffect(() => {
        if (!params.id) return;

        // Subscribe to real-time messages
        const unsubscribe = subscribeToMessages(params.id as string, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom when new messages arrive
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [params.id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !params.id) return;

        setIsSending(true);
        try {
            await sendMessage(params.id as string, user.uid, newMessage.trim());
            setNewMessage('');
        } catch (error: any) {
            console.error('Error sending message:', error);
            alert(error.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const getOtherUser = () => {
        if (!user || !conversation) return null;
        const otherUserId = conversation.participants.find(id => id !== user.uid);
        if (!otherUserId) return null;

        return {
            id: otherUserId,
            name: conversation.participantNames[otherUserId],
            photo: conversation.participantPhotos[otherUserId],
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const otherUser = getOtherUser();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--surface))] to-[hsl(var(--background))] flex flex-col">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50 border-b border-[hsl(var(--border))]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {otherUser && (
                        <div className="flex items-center gap-3 flex-1">
                            <img
                                src={otherUser.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`}
                                alt={otherUser.name}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`;
                                }}
                            />
                            <div>
                                <h2 className="font-bold">{otherUser.name}</h2>
                            </div>
                        </div>
                    )}

                    <Link href="/" className="text-xl font-bold gradient-text">
                        ReelTalk
                    </Link>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length > 0 ? (
                        messages.map((message) => {
                            const isOwn = message.senderId === user.uid;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn
                                                ? 'bg-[hsl(var(--primary))] text-white'
                                                : 'glass-card'
                                            }`}
                                    >
                                        <p className="break-words">{message.content}</p>
                                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-[hsl(var(--foreground-subtle))]'}`}>
                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-[hsl(var(--foreground-muted))]">No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Message Input */}
            <div className="glass-card border-t border-[hsl(var(--border))] p-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input flex-1"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="btn btn-primary disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
