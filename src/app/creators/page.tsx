'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Users, UserPlus, UserCheck, Trophy, Video } from 'lucide-react';
import { getAllCreators, followCreator, unfollowCreator, isFollowing } from '@/services/follow-service';

interface Creator {
    uid: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    followers: number;
    points: number;
    role: string;
}

export default function CreatorsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [processingFollow, setProcessingFollow] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchCreators = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch all creators except current user
                const creatorsData = await getAllCreators(user?.uid);
                setCreators(creatorsData as Creator[]);

                // Check following status for each creator
                if (user) {
                    const followingStatus: Record<string, boolean> = {};
                    await Promise.all(
                        creatorsData.map(async (creator) => {
                            const following = await isFollowing(user.uid, creator.uid);
                            followingStatus[creator.uid] = following;
                        })
                    );
                    setFollowingMap(followingStatus);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch creators');
                console.error('Error fetching creators:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchCreators();
        }
    }, [user]);

    const handleFollowToggle = async (creatorId: string) => {
        if (!user) return;

        setProcessingFollow(creatorId);
        try {
            const isCurrentlyFollowing = followingMap[creatorId];

            if (isCurrentlyFollowing) {
                await unfollowCreator(user.uid, creatorId);
                setFollowingMap(prev => ({ ...prev, [creatorId]: false }));

                // Update local creator followers count
                setCreators(prev =>
                    prev.map(c =>
                        c.uid === creatorId ? { ...c, followers: c.followers - 1 } : c
                    )
                );
            } else {
                await followCreator(user.uid, creatorId);
                setFollowingMap(prev => ({ ...prev, [creatorId]: true }));

                // Update local creator followers count
                setCreators(prev =>
                    prev.map(c =>
                        c.uid === creatorId ? { ...c, followers: c.followers + 1 } : c
                    )
                );
            }
        } catch (error: any) {
            console.error('Error toggling follow:', error);
            alert(error.message || 'Failed to update follow status');
        } finally {
            setProcessingFollow(null);
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

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Page Title */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-10 h-10 text-[hsl(var(--primary))]" />
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">Creators</h1>
                            </div>
                            <p className="text-[hsl(var(--foreground-muted))]">
                                Discover and follow amazing content creators
                            </p>
                        </div>

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 text-lg">{error}</p>
                            </div>
                        ) : creators.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {creators.map((creator) => (
                                    <div
                                        key={creator.uid}
                                        className="glass-card p-6 hover:shadow-lg transition-all"
                                    >
                                        {/* Creator Header */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <img
                                                src={creator.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + creator.uid}
                                                alt={creator.displayName}
                                                className="w-16 h-16 rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + creator.uid;
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg truncate">
                                                    {creator.displayName || 'Anonymous User'}
                                                </h3>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                    Creator
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        {creator.bio && (
                                            <p className="text-sm text-[hsl(var(--foreground-muted))] mb-4 line-clamp-2">
                                                {creator.bio}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-[hsl(var(--foreground-subtle))]" />
                                                <span className="text-[hsl(var(--foreground-muted))]">
                                                    {creator.followers.toLocaleString()} followers
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                                <span className="text-[hsl(var(--foreground-muted))]">
                                                    {creator.points || 0} pts
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleFollowToggle(creator.uid)}
                                                disabled={processingFollow === creator.uid}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${followingMap[creator.uid]
                                                    ? 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-elevated))]'
                                                    : 'bg-[hsl(var(--primary))] text-white hover:opacity-90'
                                                    }`}
                                            >
                                                {followingMap[creator.uid] ? (
                                                    <>
                                                        <UserCheck className="w-4 h-4" />
                                                        Following
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-4 h-4" />
                                                        Follow
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/profile/${creator.uid}`)}
                                                className="px-4 py-2 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))] rounded-lg transition-colors"
                                            >
                                                <Video className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                <p className="text-[hsl(var(--foreground-muted))] text-lg">No creators found</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
