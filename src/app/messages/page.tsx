'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { MessageCircle, Search } from 'lucide-react';
import { getConversations } from '@/services/message-service';
import { Conversation } from '@/types';

export default function MessagesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                const convos = await getConversations(user.uid);
                setConversations(convos);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [user]);

    const getOtherUser = (conversation: Conversation) => {
        if (!user) return null;
        const otherUserId = conversation.participants.find(id => id !== user.uid);
        if (!otherUserId) return null;

        return {
            id: otherUserId,
            name: conversation.participantNames[otherUserId],
            photo: conversation.participantPhotos[otherUserId],
        };
    };

    const filteredConversations = conversations.filter(conv => {
        const otherUser = getOtherUser(conv);
        if (!otherUser) return false;
        return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

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

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        {/* Page Title */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <MessageCircle className="w-10 h-10 text-[hsl(var(--primary))]" />
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">Messages</h1>
                            </div>
                            <p className="text-[hsl(var(--foreground-muted))]">
                                Chat with your friends
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input w-full pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-muted))]" />
                            </div>
                        </div>

                        {/* Conversations List */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                            </div>
                        ) : filteredConversations.length > 0 ? (
                            <div className="space-y-2">
                                {filteredConversations.map((conversation) => {
                                    const otherUser = getOtherUser(conversation);
                                    if (!otherUser) return null;

                                    const unreadCount = conversation.unreadCount[user.uid] || 0;

                                    return (
                                        <div
                                            key={conversation.id}
                                            onClick={() => router.push(`/messages/${conversation.id}`)}
                                            className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={otherUser.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`}
                                                    alt={otherUser.name}
                                                    className="w-16 h-16 rounded-full"
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.id}`;
                                                    }}
                                                />
                                                {unreadCount > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                        {unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg">{otherUser.name}</h3>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))] truncate">
                                                    {conversation.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                            {conversation.lastMessageAt && (
                                                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                                                    {new Date(conversation.lastMessageAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 glass-card">
                                <MessageCircle className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                <p className="text-[hsl(var(--foreground-muted))] text-lg">
                                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                                </p>
                                <p className="text-sm text-[hsl(var(--foreground-subtle))] mt-2">
                                    Start chatting with your friends!
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
