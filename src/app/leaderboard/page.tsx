'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Trophy, Medal, Award } from 'lucide-react';
import { getLeaderboard } from '@/services/points-service';

interface LeaderboardUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    points: number;
}

export default function LeaderboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getLeaderboard(100);
                setLeaderboard(data as LeaderboardUser[]);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch leaderboard');
                console.error('Error fetching leaderboard:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-amber-600" />;
            default:
                return <span className="text-lg font-bold text-[hsl(var(--foreground-muted))]">#{rank}</span>;
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
            case 2:
                return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
            case 3:
                return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
            default:
                return 'bg-[hsl(var(--surface))] border-[hsl(var(--border))]';
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
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        {/* Page Title */}
                        <div className="mb-8 text-center">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <Trophy className="w-10 h-10 text-yellow-500" />
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))]">Leaderboard</h1>
                            </div>
                            <p className="text-[hsl(var(--foreground-muted))]">Top performers by points earned</p>
                        </div>

                        {/* User's Rank Card */}
                        {user && (
                            <div className="glass-card p-6 mb-8 border-2 border-[hsl(var(--primary))]">
                                <p className="text-sm text-[hsl(var(--foreground-muted))] mb-2">Your Rank</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                            alt={user.displayName || 'User'}
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <div>
                                            <p className="font-bold">{user.displayName || 'You'}</p>
                                            <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                Rank: #{leaderboard.findIndex(u => u.uid === user.uid) + 1 || 'Unranked'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                                            {leaderboard.find(u => u.uid === user.uid)?.points || 0}
                                        </p>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">points</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 text-lg">{error}</p>
                            </div>
                        ) : leaderboard.length > 0 ? (
                            <div className="space-y-3">
                                {leaderboard.map((leaderUser, index) => {
                                    const rank = index + 1;
                                    return (
                                        <div
                                            key={leaderUser.uid}
                                            className={`p-4 rounded-lg border transition-all hover:shadow-lg ${getRankBg(rank)}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Rank */}
                                                <div className="w-12 flex items-center justify-center">
                                                    {getRankIcon(rank)}
                                                </div>

                                                {/* User Info */}
                                                <img
                                                    src={leaderUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                    alt={leaderUser.displayName}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-bold">{leaderUser.displayName}</p>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                        Rank #{rank}
                                                    </p>
                                                </div>

                                                {/* Points */}
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                                                        {leaderUser.points.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))]">points</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Trophy className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                <p className="text-[hsl(var(--foreground-muted))] text-lg">No users on leaderboard yet</p>
                                <p className="text-[hsl(var(--foreground-subtle))] text-sm mt-2">
                                    Complete challenges to earn points!
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
