'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Users, UserPlus, UserCheck, X, Check, MessageCircle } from 'lucide-react';
import { getPendingRequests, getFriends, acceptFriendRequest, rejectFriendRequest } from '@/services/friend-service';
import { getUserProfile } from '@/services/user-service';
import { getOrCreateConversation } from '@/services/message-service';
import { FriendRequest, User } from '@/types';

export default function FriendsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                setIsLoading(true);

                // Fetch friend requests
                const requests = await getPendingRequests(user.uid);
                setFriendRequests(requests);

                // Fetch friends
                const friendIdsList = await getFriends(user.uid);
                setFriendIds(friendIdsList);

                // Fetch friend profiles
                const friendProfiles = await Promise.all(
                    friendIdsList.map(id => getUserProfile(id))
                );
                setFriends(friendProfiles.filter(f => f !== null) as User[]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleAccept = async (requestId: string) => {
        if (!user) return;

        setProcessingRequest(requestId);
        try {
            await acceptFriendRequest(user.uid, requestId);

            // Refresh data
            const requests = await getPendingRequests(user.uid);
            setFriendRequests(requests);

            const friendIdsList = await getFriends(user.uid);
            setFriendIds(friendIdsList);

            const friendProfiles = await Promise.all(
                friendIdsList.map(id => getUserProfile(id))
            );
            setFriends(friendProfiles.filter(f => f !== null) as User[]);
        } catch (error: any) {
            console.error('Error accepting request:', error);
            alert(error.message || 'Failed to accept request');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!user) return;

        setProcessingRequest(requestId);
        try {
            await rejectFriendRequest(user.uid, requestId);

            // Refresh requests
            const requests = await getPendingRequests(user.uid);
            setFriendRequests(requests);
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            alert(error.message || 'Failed to reject request');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleMessage = async (friend: User) => {
        if (!user) return;

        try {
            const conversationId = await getOrCreateConversation(
                user.uid,
                user.displayName || 'User',
                user.photoURL,
                friend.uid,
                friend.displayName,
                friend.photoURL
            );
            router.push(`/messages/${conversationId}`);
        } catch (error: any) {
            console.error('Error creating conversation:', error);
            alert(error.message || 'Failed to start conversation');
        }
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
                                <Users className="w-10 h-10 text-[hsl(var(--primary))]" />
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">Friends</h1>
                            </div>
                            <p className="text-[hsl(var(--foreground-muted))]">
                                Manage your friends and friend requests
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6">
                            <div className="flex gap-2 border-b border-[hsl(var(--border))]">
                                <button
                                    onClick={() => setActiveTab('friends')}
                                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'friends'
                                        ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    Friends ({friends.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className={`px-6 py-3 font-medium transition-all relative ${activeTab === 'requests'
                                        ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    Requests ({friendRequests.length})
                                    {friendRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {friendRequests.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                            </div>
                        ) : activeTab === 'friends' ? (
                            friends.length > 0 ? (
                                <div className="space-y-3">
                                    {friends.map((friend) => (
                                        <div key={friend.uid} className="glass-card p-4 flex items-center gap-4">
                                            <img
                                                src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`}
                                                alt={friend.displayName}
                                                className="w-16 h-16 rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`;
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{friend.displayName}</h3>
                                                {friend.bio && (
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))] line-clamp-1">
                                                        {friend.bio}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMessage(friend)}
                                                    className="btn btn-primary"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    Message
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/profile/${friend.uid}`)}
                                                    className="btn btn-secondary"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-card">
                                    <Users className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                    <p className="text-[hsl(var(--foreground-muted))] text-lg">No friends yet</p>
                                    <p className="text-sm text-[hsl(var(--foreground-subtle))] mt-2">
                                        Visit the Creators page to find people to connect with
                                    </p>
                                </div>
                            )
                        ) : (
                            friendRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {friendRequests.map((request) => (
                                        <div key={request.id} className="glass-card p-4 flex items-center gap-4">
                                            <img
                                                src={request.fromUserPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromUserId}`}
                                                alt={request.fromUserName}
                                                className="w-16 h-16 rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromUserId}`;
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{request.fromUserName}</h3>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                    Sent {new Date(request.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAccept(request.fromUserId)}
                                                    disabled={processingRequest === request.fromUserId}
                                                    className="btn btn-primary disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request.fromUserId)}
                                                    disabled={processingRequest === request.fromUserId}
                                                    className="btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-card">
                                    <UserPlus className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                    <p className="text-[hsl(var(--foreground-muted))] text-lg">No pending requests</p>
                                </div>
                            )
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
