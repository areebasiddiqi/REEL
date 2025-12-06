'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Trophy, Video, Calendar, UserPlus, UserCheck, Settings, MessageCircle, UserMinus } from 'lucide-react';
import { getUserProfile } from '@/services/user-service';
import { getUserVideos } from '@/services/video-service';
import { getUserChallenges } from '@/services/challenge-service';
import { followCreator, unfollowCreator, isFollowing } from '@/services/follow-service';
import { areFriends, sendFriendRequest, hasPendingRequest, removeFriend } from '@/services/friend-service';
import { getOrCreateConversation } from '@/services/message-service';
import { getCreatorSubscription, isSubscribedTo } from '@/services/subscription-service';
import { User, Video as VideoType, Challenge, CreatorSubscription } from '@/types';
import PremiumBadge from '@/components/PremiumBadge';

export default function ProfilePage() {
    const { user: currentUser, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [videos, setVideos] = useState<VideoType[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [requestPending, setRequestPending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'videos' | 'challenges'>('videos');
    const [processingFollow, setProcessingFollow] = useState(false);
    const [processingFriend, setProcessingFriend] = useState(false);
    const [creatorSubscription, setCreatorSubscription] = useState<CreatorSubscription | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [processingSubscription, setProcessingSubscription] = useState(false);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!params.id) return;

            try {
                setIsLoading(true);
                setError(null);

                const userId = params.id as string;

                // Fetch user profile
                const profile = await getUserProfile(userId);
                if (!profile) {
                    setError('User not found');
                    return;
                }
                setProfileUser(profile);

                // Fetch user's videos
                const userVideos = await getUserVideos(userId);
                setVideos(userVideos);

                // Fetch user's challenges
                const userChallenges = await getUserChallenges(userId);
                setChallenges(userChallenges);

                // Check if current user is following this profile
                if (currentUser && currentUser.uid !== userId) {
                    const following = await isFollowing(currentUser.uid, userId);
                    setIsFollowingUser(following);

                    // Check friendship status
                    const friends = await areFriends(currentUser.uid, userId);
                    setIsFriend(friends);

                    // Check if request pending
                    const pending = await hasPendingRequest(currentUser.uid, userId);
                    setRequestPending(pending);

                    // Check subscription status
                    const subscribed = await isSubscribedTo(currentUser.uid, userId);
                    setIsSubscribed(subscribed);
                }

                // Fetch creator subscription if they have one
                const subscription = await getCreatorSubscription(userId);
                setCreatorSubscription(subscription);
            } catch (err: any) {
                setError(err.message || 'Failed to load profile');
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [params.id, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser || !profileUser) return;

        setProcessingFollow(true);
        try {
            if (isFollowingUser) {
                await unfollowCreator(currentUser.uid, profileUser.uid);
                setIsFollowingUser(false);
                setProfileUser(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
            } else {
                await followCreator(currentUser.uid, profileUser.uid);
                setIsFollowingUser(true);
                setProfileUser(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
            }
        } catch (error: any) {
            console.error('Error toggling follow:', error);
            alert(error.message || 'Failed to update follow status');
        } finally {
            setProcessingFollow(false);
        }
    };

    const handleFriendRequest = async () => {
        if (!currentUser || !profileUser) return;

        setProcessingFriend(true);
        try {
            await sendFriendRequest(
                currentUser.uid,
                currentUser.displayName || 'User',
                currentUser.photoURL,
                profileUser.uid
            );
            setRequestPending(true);
            alert('Friend request sent!');
        } catch (error: any) {
            console.error('Error sending friend request:', error);
            alert(error.message || 'Failed to send friend request');
        } finally {
            setProcessingFriend(false);
        }
    };

    const handleMessage = async () => {
        if (!currentUser || !profileUser) return;

        try {
            const conversationId = await getOrCreateConversation(
                currentUser.uid,
                currentUser.displayName || 'User',
                currentUser.photoURL,
                profileUser.uid,
                profileUser.displayName,
                profileUser.photoURL
            );
            router.push(`/messages/${conversationId}`);
        } catch (error: any) {
            console.error('Error creating conversation:', error);
            alert(error.message || 'Failed to start conversation');
        }
    };

    const handleSubscribe = async () => {
        if (!currentUser || !profileUser || !creatorSubscription) return;

        // Temporarily disabled - allow all users to subscribe
        // Check if user has premium
        // if (currentUser.premiumPlan !== 'premium') {
        //     router.push('/premium');
        //     return;
        // }

        try {
            setProcessingSubscription(true);

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'subscription',
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    creatorId: profileUser.uid,
                    creatorName: profileUser.displayName,
                    price: creatorSubscription.price,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error creating subscription checkout:', error);
            alert(error.message || 'Failed to start subscription');
            setProcessingSubscription(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!currentUser) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--surface))] to-[hsl(var(--background))]">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50 border-b border-[hsl(var(--border))]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Link href="/" className="text-2xl font-bold gradient-text">
                            ReelTalk
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-500 text-lg">{error}</p>
                    </div>
                ) : profileUser ? (
                    <>
                        {/* Profile Header */}
                        <div className="glass-card p-8 mb-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Profile Photo */}
                                <img
                                    src={profileUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.uid}`}
                                    alt={profileUser.displayName}
                                    className="w-32 h-32 rounded-full"
                                    onError={(e) => {
                                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.uid}`;
                                    }}
                                />

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold mb-2">{profileUser.displayName}</h1>
                                    {profileUser.bio && (
                                        <p className="text-[hsl(var(--foreground-muted))] mb-4">{profileUser.bio}</p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex flex-wrap gap-6 mb-4">
                                        <div>
                                            <p className="text-2xl font-bold">{videos.length}</p>
                                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Videos</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{profileUser.followers.toLocaleString()}</p>
                                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Followers</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{profileUser.following.toLocaleString()}</p>
                                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Following</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-yellow-500">{profileUser.points.toLocaleString()}</p>
                                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Points</p>
                                        </div>
                                    </div>

                                    {/* Joined Date */}
                                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-subtle))]">
                                        <Calendar className="w-4 h-4" />
                                        Joined {formatDate(profileUser.createdAt)}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2">
                                    {currentUser.uid === profileUser.uid ? (
                                        <Link href="/settings" className="btn btn-secondary">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </Link>
                                    ) : (
                                        <>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleFollowToggle}
                                                    disabled={processingFollow}
                                                    className={`btn ${isFollowingUser ? 'btn-secondary' : 'btn-primary'} disabled:opacity-50`}
                                                >
                                                    {isFollowingUser ? (
                                                        <>
                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                            Following
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus className="w-4 h-4 mr-2" />
                                                            Follow
                                                        </>
                                                    )}
                                                </button>
                                                {isFriend ? (
                                                    <button
                                                        onClick={handleMessage}
                                                        className="btn btn-primary"
                                                    >
                                                        <MessageCircle className="w-4 h-4 mr-2" />
                                                        Message
                                                    </button>
                                                ) : requestPending ? (
                                                    <button
                                                        disabled
                                                        className="btn btn-secondary opacity-50 cursor-not-allowed"
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                        Request Sent
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleFriendRequest}
                                                        disabled={processingFriend}
                                                        className="btn btn-secondary disabled:opacity-50"
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-2" />
                                                        Add Friend
                                                    </button>
                                                )}
                                            </div>

                                            {/* Subscription Button */}
                                            {creatorSubscription && creatorSubscription.active && currentUser.uid !== profileUser.uid && (
                                                <div className="mt-2">
                                                    {isSubscribed ? (
                                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                                                            <p className="text-sm font-medium text-green-500">
                                                                ✓ Subscribed
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={handleSubscribe}
                                                            disabled={processingSubscription}
                                                            className="w-full btn btn-primary disabled:opacity-50"
                                                        >
                                                            {processingSubscription ? (
                                                                'Processing...'
                                                            ) : (
                                                                <>
                                                                    <PremiumBadge size="sm" />
                                                                    <span className="ml-2">
                                                                        Subscribe for ${(creatorSubscription.price / 100).toFixed(2)}/month
                                                                    </span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Premium Badge */}
                        {profileUser.premiumPlan === 'premium' && (
                            <div className="mb-4 flex items-center gap-2 text-yellow-500">
                                <PremiumBadge size="md" showLabel />
                                <span className="text-sm">Member</span>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="mb-6">
                            <div className="flex gap-2 border-b border-[hsl(var(--border))]">
                                <button
                                    onClick={() => setActiveTab('videos')}
                                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'videos'
                                        ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    <Video className="w-4 h-4 inline mr-2" />
                                    Videos ({videos.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('challenges')}
                                    className={`px-6 py-3 font-medium transition-all ${activeTab === 'challenges'
                                        ? 'text-[hsl(var(--primary))] border-b-2 border-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    <Trophy className="w-4 h-4 inline mr-2" />
                                    Challenges ({challenges.length})
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {activeTab === 'videos' ? (
                            videos.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {videos.map((video) => (
                                        <div
                                            key={video.id}
                                            className="cursor-pointer group glass-card overflow-hidden hover:shadow-lg transition-all"
                                            onClick={() => router.push(`/videos/${video.id}`)}
                                        >
                                            <div className="relative bg-black aspect-video">
                                                <img
                                                    src={video.thumbnailUrl}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                                                    {video.title}
                                                </h3>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                    {video.views.toLocaleString()} views
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-card">
                                    <Video className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                    <p className="text-[hsl(var(--foreground-muted))]">No videos yet</p>
                                </div>
                            )
                        ) : (
                            challenges.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {challenges.map((challenge) => (
                                        <div
                                            key={challenge.id}
                                            className="cursor-pointer group glass-card overflow-hidden hover:shadow-lg transition-all"
                                            onClick={() => router.push(`/challenges/${challenge.id}`)}
                                        >
                                            <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] h-48">
                                                {challenge.thumbnailUrl && (
                                                    <img
                                                        src={challenge.thumbnailUrl}
                                                        alt={challenge.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                                <div className="absolute top-2 left-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                                                    <Trophy className="w-4 h-4 inline mr-1" />
                                                    {challenge.pointsReward}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                                                    {challenge.title}
                                                </h3>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                    {challenge.participants} participants
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 glass-card">
                                    <Trophy className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                    <p className="text-[hsl(var(--foreground-muted))]">No challenges created yet</p>
                                </div>
                            )
                        )}
                    </>
                ) : null}
            </main>
        </div>
    );
}
